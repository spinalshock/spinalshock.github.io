---
slug: youtube-transcript-mcp-server
title: Building a YouTube Transcript MCP Server with Go and yt-dlp
authors: [om]
tags: [go, mcp, youtube, yt-dlp, ai]
---

# Building a YouTube Transcript MCP Server: From Concept to Production

Ever wanted to seamlessly extract YouTube transcripts and metadata directly within your AI workflows? Today I'll walk you through building a production-ready Model Context Protocol (MCP) server in Go that provides YouTube transcript extraction capabilities to AI assistants like Claude.

<!-- truncate -->

## The Problem: AI Needs Context, YouTube Has It

When working with AI assistants, you often want to reference YouTube videos - whether for content analysis, summarization, or research. However, manually copying transcripts is tedious, and existing solutions often lack the robustness needed for production workflows.

**What I needed:**

- Direct YouTube transcript access from AI tools
- Metadata extraction (title, channel, duration)
- Robust error handling and rate limiting
- Support for multiple languages and subtitle formats
- Zero external API dependencies (no YouTube Data API keys)

## The Existing Solutions Problem

Before building my own solution, I explored existing MCP servers using the Smithery CLI tool. Smithery provides a registry of pre-built MCP servers, including several YouTube-related ones. However, I quickly discovered a critical limitation: many of these servers appeared to be IP-banned by Google.

When testing various YouTube transcript servers from Smithery, I consistently encountered:
- HTTP 403 Forbidden errors
- Connection timeouts
- Rate limiting responses even on first requests

This suggested that popular public MCP servers get blocked by YouTube/Google due to high usage volumes from multiple users sharing the same server infrastructure. For reliable use with Claude Code, especially for batch video summarization workflows, I needed a solution that:

1. Runs locally (avoiding shared IP blocks)
2. Implements proper rate limiting 
3. Has robust error handling for edge cases
4. Can be customized for specific use cases

This realization led me to build a custom MCP server rather than relying on potentially unreliable third-party services.

## The Solution: MCP + yt-dlp + Go

The Model Context Protocol (MCP) provides a standardized way for AI assistants to interact with external tools and data sources. By building an MCP server, we can expose YouTube transcript functionality directly to Claude and other compatible AI systems.

## Architecture Deep Dive

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Claude/AI     │◄──►│   MCP Server    │◄──►│    yt-dlp       │
│                 │    │   (Go Binary)   │    │  (External CLI) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                               ▼
                       ┌─────────────────┐
                       │ Web Scraping    │
                       │ (Video Metadata)│
                       └─────────────────┘
```

**Key Design Decisions:**

- **Go**: For performance, easy deployment, and excellent concurrency support
- **yt-dlp**: Battle-tested YouTube extraction with subtitle support
- **Dual extraction**: yt-dlp for transcripts, web scraping for metadata
- **Rate limiting**: Built-in delays to avoid YouTube rate limits
- **Local execution**: Avoids IP bans that affect shared services

### MCP Protocol Implementation

The server exposes two primary tools:

```go
// Tool 1: Transcript Extraction
transcriptTool := mcp.NewTool("get_transcript",
    mcp.WithDescription("Fetch transcript from a YouTube video URL"),
    mcp.WithString("url",
        mcp.Required(),
        mcp.Description("YouTube video URL (e.g., https://youtube.com/watch?v=...)"),
    ),
)

// Tool 2: Video Metadata
videoInfoTool := mcp.NewTool("get_video_info",
    mcp.WithDescription("Get metadata (title, channel, duration) from a YouTube video URL"),
    mcp.WithString("url",
        mcp.Required(),
        mcp.Description("YouTube video URL"),
    ),
)
```

## Implementation Journey

### Step 1: Setting Up the Go MCP Framework

I started with the `mark3labs/mcp-go` library, which provides excellent MCP protocol handling:

```go
package main

import (
    "github.com/mark3labs/mcp-go/mcp"
    "github.com/mark3labs/mcp-go/server"
)

func main() {
    // Create MCP server
    s := server.NewMCPServer(
        "youtube-transcript-mcp",
        "1.0.0",
    )
    
    // Add tools and handlers
    s.AddTool(transcriptTool, handleGetTranscript)
    s.AddTool(videoInfoTool, handleGetVideoInfo)
    
    // Start server (listens on stdin/stdout)
    s.Serve()
}
```

### Step 2: The yt-dlp Integration Challenge

Getting yt-dlp to work reliably required handling several edge cases:

```go
func getTranscript(url string) (string, error) {
    // Create temporary directory for yt-dlp output
    tmpDir, err := os.MkdirTemp("", "yt-transcript-*")
    if err != nil {
        return "", fmt.Errorf("failed to create temp directory: %v", err)
    }
    defer os.RemoveAll(tmpDir)
    
    // Try English subtitles first
    cmd := exec.Command("yt-dlp",
        "--write-subs", "--write-auto-subs",
        "--sub-lang", "en", "--sub-format", "vtt",
        "--skip-download",
        "--output", tmpDir+"/%(title)s.%(ext)s",
        url,
    )
    
    if err := cmd.Run(); err != nil {
        // Fallback to any available language
        return tryFallbackLanguage(url, tmpDir)
    }
    
    return parseVTTFiles(tmpDir)
}
```

**Key Challenges Solved:**

1. **Temporary file management**: Proper cleanup of yt-dlp output files
2. **Language fallback**: Try English first, then any available language
3. **VTT parsing**: Convert WebVTT format to clean text
4. **Error handling**: Graceful failure when transcripts aren't available

### Step 3: VTT Format Parsing

YouTube transcripts come in WebVTT format, which includes timestamps and formatting:

```vtt
WEBVTT

00:00:01.000 --> 00:00:03.500
Welcome to this tutorial on building

00:00:03.500 --> 00:00:06.000
MCP servers with Go and yt-dlp
```

I built a parser to extract clean text:

```go
func parseVTTContent(content string) string {
    lines := strings.Split(content, "\n")
    var textLines []string
    
    for _, line := range lines {
        line = strings.TrimSpace(line)
        
        // Skip headers, timestamps, and empty lines
        if line == "" || line == "WEBVTT" || 
           strings.Contains(line, "-->") ||
           regexp.MustCompile(`^\d+$`).MatchString(line) {
            continue
        }
        
        // Remove VTT formatting tags
        line = regexp.MustCompile(`<[^>]*>`).ReplaceAllString(line, "")
        
        textLines = append(textLines, line)
    }
    
    return strings.Join(textLines, " ")
}
```

### Step 4: Metadata Extraction via Web Scraping

For video metadata, I used web scraping since it's more reliable than yt-dlp for this purpose:

```go
func getVideoInfo(url string) (*VideoInfo, error) {
    // Validate YouTube URL first
    if !isYouTubeURL(url) {
        return nil, fmt.Errorf("invalid URL: not a YouTube video URL")
    }
    
    resp, err := soup.Get(url)
    if err != nil {
        return nil, fmt.Errorf("failed to fetch video page: %v", err)
    }
    
    doc := soup.HTMLParse(resp)
    info := &VideoInfo{URL: url}
    
    // Extract title from OpenGraph meta tags
    if titleMeta := doc.Find("meta", "property", "og:title"); titleMeta.Error == nil {
        info.Title = titleMeta.Attrs()["content"]
    }
    
    // Extract channel and duration from page scripts
    scripts := doc.FindAll("script")
    for _, script := range scripts {
        if strings.Contains(script.Text(), `"channelName"`) {
            // Parse JSON data from script tags
            extractChannelAndDuration(script.Text(), info)
        }
    }
    
    return info, nil
}
```

### Step 5: Rate Limiting and Production Considerations

YouTube aggressively rate-limits requests, so I implemented randomized delays:

```go
func randomSleep(minMs, maxMs int) {
    if minMs >= maxMs {
        maxMs = minMs + 1
    }
    duration := minMs + rand.Intn(maxMs-minMs)
    log.Printf("Sleeping for %d ms to avoid rate limits...", duration)
    time.Sleep(time.Duration(duration) * time.Millisecond)
}
```

**Production Features Added:**

- **URL validation**: Ensure only YouTube URLs are processed
- **Graceful error handling**: Return meaningful error messages
- **Logging**: Comprehensive logging for debugging
- **Resource cleanup**: Proper temporary file management

## Testing Strategy

Building robust tests for network-dependent code requires careful consideration:

```go
func TestExtractVideoMetadata(t *testing.T) {
    tests := []struct {
        name        string
        url         string
        expectError bool
    }{
        {
            name:        "Valid YouTube URL",
            url:         "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            expectError: false,
        },
        {
            name:        "Invalid URL",
            url:         "https://example.com",
            expectError: true,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            info, err := getVideoInfo(tt.url)
            
            if tt.expectError {
                if err == nil {
                    t.Errorf("Expected error for URL %s, but got none", tt.url)
                }
                return
            }
            
            if err != nil {
                t.Errorf("Unexpected error for URL %s: %v", tt.url, err)
            }
        })
    }
}
```

**Testing Considerations:**

- **Network dependency**: Tests make real HTTP requests
- **Rate limiting**: Tests include delays, making them slow
- **Flaky YouTube behavior**: Some tests may fail due to external factors
- **Coverage limitations**: Main function and handlers are difficult to test without mocking

## Deployment and Distribution

### Building for Multiple Platforms

Go's cross-compilation makes distribution easy:

```bash
# Linux
GOOS=linux GOARCH=amd64 go build -o youtube-transcript-mcp-linux

# Windows  
GOOS=windows GOARCH=amd64 go build -o youtube-transcript-mcp.exe

# macOS ARM64
GOOS=darwin GOARCH=arm64 go build -o youtube-transcript-mcp-macos-arm64
```

### Claude Desktop Integration

The server integrates seamlessly with Claude Desktop:

```json
{
  "mcpServers": {
    "youtube-transcript": {
      "command": "/path/to/youtube-transcript-mcp"
    }
  }
}
```

## Real-World Performance and Lessons Learned

After deploying the server and using it for several weeks:

### What Works Well

✅ **Robust transcript extraction** - Handles various YouTube video types  
✅ **Multi-language support** - Automatic fallback to available languages  
✅ **Rate limit compliance** - No blocks from YouTube after thousands of requests  
✅ **Fast metadata extraction** - Sub-second response times for video info  
✅ **Zero API keys required** - No external service dependencies  
✅ **Local execution** - Avoids IP bans that affect shared Smithery servers

### Challenges and Solutions

**Challenge: yt-dlp Version Dependencies**
- *Problem*: Different yt-dlp versions have varying CLI interfaces
- *Solution*: Documented specific version requirements and error handling

**Challenge: Temporary File Management**
- *Problem*: yt-dlp creates many temporary files that need cleanup  
- *Solution*: Defer statements and proper error handling ensure cleanup

**Challenge: Network Reliability**
- *Problem*: YouTube occasionally blocks requests or returns errors
- *Solution*: Exponential backoff and graceful error reporting

## Advanced Use Cases Unlocked

With the MCP server running, several powerful workflows became possible:

### Batch Video Analysis

```
User: "Analyze these 5 YouTube videos about Go programming and create a comprehensive comparison of their teaching approaches"

Claude: *Uses the MCP server to fetch all transcripts, then provides detailed analysis*
```

### Content Research Pipelines

```
User: "Extract transcripts from this YouTube playlist and create a structured summary document"

Claude: *Processes each video individually, extracts transcripts, and synthesizes insights*
```

### Educational Content Processing

```
User: "Get the transcript from this technical talk and create practice questions for a programming course"

Claude: *Fetches transcript via MCP server and generates educational materials*
```

## Future Enhancements

Several improvements are on the roadmap:

### Caching Layer
- **Problem**: Re-fetching the same videos is wasteful
- **Solution**: Redis/disk-based caching with TTL

### Playlist Support  
- **Problem**: Processing playlists requires multiple manual requests
- **Solution**: New MCP tool for batch playlist processing

### Advanced Metadata
- **Problem**: Limited metadata compared to YouTube Data API
- **Solution**: Enhanced scraping for view counts, upload dates, descriptions

### Concurrent Processing
- **Problem**: Sequential processing is slow for batch operations
- **Solution**: Worker pool with rate limiting

## Code Organization and Best Practices

The final codebase follows Go best practices:

```
youtube-transcript-mcp/
├── main.go              # Core server implementation
├── main_test.go         # Test suite
├── go.mod               # Dependencies
├── README.md            # Comprehensive documentation  
├── CLAUDE.md            # Developer guidance
├── LICENSE              # MIT license
└── .gitignore           # Build artifacts exclusion
```

**Key Patterns Used:**

- **Error wrapping**: Providing context with `fmt.Errorf`
- **Resource cleanup**: Defer statements for temporary files
- **Structured logging**: Consistent log messages for debugging
- **URL validation**: Input sanitization and validation
- **Graceful degradation**: Fallback mechanisms for failures

## Security Considerations

### Input Validation
- All URLs validated before processing
- No arbitrary command execution beyond controlled yt-dlp usage
- Temporary files created in secure temporary directories

### Rate Limiting
- Built-in delays prevent abuse
- Exponential backoff for failed requests
- No persistent connections or session management

### Data Handling
- No sensitive data logged or stored
- Transcripts processed in memory only
- Temporary files cleaned up immediately

## Conclusion

Building the YouTube Transcript MCP Server taught me several valuable lessons about creating production-ready AI tooling:

1. **External Dependencies Matter**: yt-dlp's reliability made this project possible
2. **Error Handling is Critical**: Network operations require robust error handling
3. **Rate Limiting is Essential**: Respecting service limits prevents blocks
4. **Testing Network Code is Hard**: Mocking vs. integration tests require balance
5. **Documentation Drives Adoption**: Comprehensive docs make tools usable
6. **Local Solutions Beat Shared Services**: Custom implementations avoid IP bans that plague shared infrastructure

The server now provides seamless YouTube transcript access to AI workflows, enabling powerful content analysis and research capabilities. The MCP protocol makes integration effortless, while Go's performance and deployment characteristics make it suitable for production use.

## Key Takeaways for MCP Development

### Protocol Benefits
- **Standardization**: MCP provides consistent AI tool integration
- **Flexibility**: Easy to expose complex functionality through simple interfaces  
- **Extensibility**: Adding new tools requires minimal code changes

### Implementation Tips
- **Start simple**: Begin with core functionality, add features iteratively
- **Handle failures gracefully**: Network operations will fail, plan for it
- **Document thoroughly**: Good docs are essential for AI tool adoption
- **Test extensively**: Even simple tools have edge cases
- **Consider IP restrictions**: Shared services may be blocked, local solutions are more reliable

### Go-Specific Advantages
- **Single binary deployment**: No dependency management nightmares
- **Excellent concurrency**: Built for network-heavy operations
- **Strong ecosystem**: Libraries like mcp-go accelerate development
- **Cross-platform builds**: Easy distribution across operating systems

The combination of MCP, Go, and yt-dlp creates a powerful foundation for YouTube content integration in AI workflows. Whether you're building research tools, content analysis systems, or educational platforms, this pattern provides a robust, scalable approach to video content extraction that avoids the pitfalls of shared infrastructure solutions.

## Resources

- [YouTube Transcript MCP Server](https://github.com/spinalshock/youtube-transcript-mcp) - Complete source code
- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification
- [mcp-go](https://github.com/mark3labs/mcp-go) - Go MCP implementation
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - YouTube content extraction tool
- [Claude Desktop](https://claude.ai/code) - MCP-compatible AI assistant
- [Smithery](https://smithery.ai/) - MCP server registry (for reference, though many servers face IP restrictions)