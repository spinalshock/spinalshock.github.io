---
slug: algolia-search-implementation
title: How to Add Algolia DocSearch to Your Docusaurus Site
authors: [om]
tags: [tech, docusaurus, react]
---

# How to Add Algolia DocSearch to Your Docusaurus Site

Adding powerful search functionality to your Docusaurus documentation site is easier than you might think. In this guide, I'll walk you through implementing Algolia DocSearch, a free search service that provides fast, intelligent search for documentation websites.

<!-- truncate -->

## What is Algolia DocSearch?

Algolia DocSearch is a free search service specifically designed for documentation websites. It offers:

- **Intelligent web crawling** that understands your site structure
- **Lightning-fast search** with typo tolerance and instant results
- **Beautiful, customizable UI** components
- **Contextual search** that filters results by section and version
- **Mobile-optimized** search experience

Best of all, it's completely free for open-source projects and documentation sites.

## Prerequisites

Before getting started, you'll need:

- A Docusaurus site (this guide uses Docusaurus 3.x)
- Your site deployed and publicly accessible
- Access to modify your site's configuration files

## Step 1: Apply for Algolia DocSearch

1. Visit [https://docsearch.algolia.com/apply/](https://docsearch.algolia.com/apply/)
2. Fill out the application form with:
   - Your site URL (e.g., `https://yoursite.github.io`)
   - Your email address
   - Mention that it's a Docusaurus site
3. Wait for approval (usually takes 1-3 business days)

Once approved, Algolia will provide you with:
- **Application ID** (`appId`)
- **Search API Key** (`apiKey`) 
- **Index Name** (`indexName`)
- **Domain verification token**

## Step 2: Install the Algolia Theme (Optional)

If you're using the Docusaurus `classic` preset, the Algolia theme is already included. However, you can explicitly install it if needed:

```bash
npm install --save @docusaurus/theme-search-algolia
```

## Step 3: Configure Algolia in Docusaurus

Add the Algolia configuration to your `docusaurus.config.js` or `docusaurus.config.ts` file:

```typescript
const config: Config = {
  // ... other configuration

  // Add domain verification meta tag
  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'algolia-site-verification',
        content: 'YOUR_VERIFICATION_TOKEN', // Replace with your token
      },
    },
  ],

  themeConfig: {
    // ... other theme configuration
    
    // Algolia DocSearch configuration
    algolia: {
      // The application ID provided by Algolia
      appId: 'YOUR_APP_ID',

      // Public API key: it is safe to commit it
      apiKey: 'YOUR_SEARCH_API_KEY',

      indexName: 'YOUR_INDEX_NAME',

      // Optional: see doc section below
      contextualSearch: true,

      // Optional: Specify domains where the navigation should occur through window.location instead on history.push
      // externalUrlRegex: 'external\.com|domain\.com',

      // Optional: Replace parts of the item URLs from Algolia
      // replaceSearchResultPathname: {
      //   from: '/docs/', // or as RegExp: /\/docs\//
      //   to: '/',
      // },

      // Optional: Algolia search parameters
      searchParameters: {},

      // Optional: path for search page that enabled by default (`false` to disable it)
      searchPagePath: 'search',

      // Optional: whether the insights feature is enabled or not on Docsearch (`false` by default)
      insights: false,
    },
  },
};

export default config;
```

Replace the placeholder values with your actual Algolia credentials:
- `YOUR_APP_ID` → Your Application ID
- `YOUR_SEARCH_API_KEY` → Your search-only API key
- `YOUR_INDEX_NAME` → Your index name
- `YOUR_VERIFICATION_TOKEN` → Your domain verification token

## Step 4: Understanding the Configuration Options

### Essential Configuration

```typescript
algolia: {
  appId: 'CVMSX0G1O3',                    // Your Algolia Application ID
  apiKey: '52a5485a806426a4cedd116...',   // Search-only API key (safe to commit)
  indexName: 'my-documentation',           // Your search index name
}
```

### Advanced Options

```typescript
algolia: {
  // ... essential config above
  
  contextualSearch: true,           // Enable contextual search for better results
  searchPagePath: 'search',         // Dedicated search page URL
  searchParameters: {               // Additional Algolia search parameters
    facetFilters: ['language:en'],  // Filter by language
    hitsPerPage: 10,               // Number of results per page
  },
  insights: true,                   // Enable search analytics (optional)
}
```

### Domain Verification

The `headTags` configuration adds a meta tag to your site's `<head>` that Algolia uses to verify domain ownership:

```typescript
headTags: [
  {
    tagName: 'meta',
    attributes: {
      name: 'algolia-site-verification',
      content: 'BFA78AE87A7D9FDF', // Your unique verification token
    },
  },
],
```

## Step 5: Deploy and Test

1. **Build your site**: `npm run build`
2. **Deploy** to your hosting platform (GitHub Pages, Netlify, Vercel, etc.)
3. **Wait for crawling**: Algolia will automatically crawl and index your site (this can take 24-48 hours)
4. **Test search**: Once indexed, you should see a search bar in your navigation

## Features You Get Out of the Box

### Search Bar Integration
- Appears automatically in your navigation bar
- Supports keyboard shortcuts (typically `Ctrl+K` or `Cmd+K`)
- Real-time search as you type

### Dedicated Search Page
- Available at `/search` by default
- Full-page search experience with advanced filtering
- Mobile-friendly interface

### Contextual Search
When enabled, search results are filtered based on:
- Current documentation section
- Site version (if using versioned docs)
- Language (if using internationalization)

## Customization Options

### Custom Search Parameters

```typescript
algolia: {
  // ... other config
  searchParameters: {
    facetFilters: ['language:en', 'version:1.0'],
    attributesToRetrieve: ['title', 'content', 'url'],
    attributesToHighlight: ['title', 'content'],
    attributesToSnippet: ['content:20'],
  },
}
```

### URL Path Replacement

If you need to modify URLs in search results:

```typescript
algolia: {
  // ... other config
  replaceSearchResultPathname: {
    from: '/docs/', // Original path
    to: '/',        // Replacement path
  },
}
```

## Security and Best Practices

### API Key Safety
- The search API key is **safe to commit** to your repository
- It's a read-only, search-only key that can't modify your index
- Never commit your Admin API key (if you have one)

### Performance Optimization
```typescript
algolia: {
  // ... other config
  searchParameters: {
    hitsPerPage: 8,                    // Limit results for faster loading
    attributesToRetrieve: [            // Only fetch needed fields
      'title', 
      'content', 
      'url'
    ],
  },
}
```

## Final Implementation Example

Here's a complete working example:

```typescript
import type { Config } from '@docusaurus/types';

const config: Config = {
  title: 'My Documentation',
  url: 'https://mydocs.github.io',
  baseUrl: '/',

  // Domain verification for Algolia crawler
  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'algolia-site-verification',
        content: 'BFA78AE87A7D9FDF',
      },
    },
  ],

  themeConfig: {
    algolia: {
      appId: 'CVMSX0G1O3',
      apiKey: '52a5485a806426a4cedd116a41c3a4c1',
      indexName: 'my-docs',
      contextualSearch: true,
      searchPagePath: 'search',
      searchParameters: {},
      insights: false,
    },
  },
};

export default config;
```

## Troubleshooting

### Search Not Appearing?
- Ensure your site is publicly accessible
- Verify your API credentials are correct
- Check that domain verification is complete
- Wait 24-48 hours for initial indexing

### No Search Results?
- Confirm Algolia has crawled your site (check the Algolia dashboard)
- Verify your index contains documents
- Test with simple, common words first

## Conclusion

Algolia DocSearch transforms your Docusaurus site into a powerful, searchable knowledge base with minimal configuration. The integration is straightforward, and the results are impressive - your users will have fast, intelligent search across all your documentation.

The key steps are:
1. Apply for DocSearch access
2. Add configuration to your Docusaurus config
3. Include domain verification
4. Deploy and wait for indexing

Once set up, your documentation becomes much more discoverable and user-friendly, helping visitors find exactly what they're looking for quickly and easily.