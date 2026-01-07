(function() {
  'use strict';
  
  // Configuration from server
  const config = {
    token: 'iKQL9tDMF7tEDXVag7KuWg5cvKNkkldj',
    apiUrl: 'https://api.otimizey.com.br',
    enabledEvents: ["PageView","AddToCart","InitiateCheckout"],
    pixelIds: ["5dec06c4-9232-42e3-9df6-a73d34dcb1c0"],
    checkoutUrlPatterns: []
  };
  
  // Generate unique visitor ID
  function getVisitorId() {
    let visitorId = localStorage.getItem('oti_visitor_id');
    if (!visitorId) {
      visitorId = 'oti_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('oti_visitor_id', visitorId);
    }
    return visitorId;
  }
  
  // Get or create session key
  function getSessionKey() {
    let sessionKey = sessionStorage.getItem('oti_session_key');
    if (!sessionKey) {
      sessionKey = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem('oti_session_key', sessionKey);
    }
    return sessionKey;
  }
  
  // Parse URL parameters and append visitor ID to utm_medium
  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    
    // Facebook params
    if (params.get('fbclid')) {
      result.fbc = 'fb.1.' + Date.now() + '.' + params.get('fbclid');
    }
    
    // Google params
    if (params.get('gclid')) {
      result.gclid = params.get('gclid');
    }
    
    // UTM params
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(param => {
      const value = params.get(param);
      if (value) {
        result[param] = value;
      }
    });
    
    // Append visitor ID to utm_medium if not already present and update URL
    const visitorId = getVisitorId();
    const visitorTag = '--oti--' + visitorId;

    // Check if any checkoutUrlPatterns includes 'hotmart'
    const hasHotmart = Array.isArray(config.checkoutUrlPatterns)
      && config.checkoutUrlPatterns.some(pattern => typeof pattern === 'string' && pattern.toLowerCase().includes('hotmart'));

    const appendVisitorTag = (value) => {
      return value && !value.includes('--oti--') ? value + visitorTag : value;
    };

    // Handle utm_medium
    if (result.utm_medium) {
      if (!result.utm_medium.includes('--oti--')) {
        result.utm_medium = appendVisitorTag(result.utm_medium);

        // Update the URL without reloading the page
        const newParams = new URLSearchParams(window.location.search);
        newParams.set('utm_medium', result.utm_medium);

        // If Hotmart and xcod present, append visitor tag to xcod too
        if (hasHotmart) {
          let xcod = newParams.get('xcod');
          if (xcod && !xcod.includes('--oti--')) {
            xcod = appendVisitorTag(xcod);
            newParams.set('xcod', xcod);
            result.xcod = xcod;
          }
        }

        const newUrl = window.location.pathname + '?' + newParams.toString() + window.location.hash;
        window.history.replaceState({}, '', newUrl);
      }
    } else {
      result.utm_medium = '1' + visitorTag;

      // Update the URL without reloading the page
      const newParams = new URLSearchParams(window.location.search);
      newParams.set('utm_medium', result.utm_medium);

      // If Hotmart and xcod present, append visitor tag to xcod too
      if (hasHotmart) {
        let xcod = newParams.get('xcod');
        if (xcod && !xcod.includes('--oti--')) {
          xcod = appendVisitorTag(xcod);
          newParams.set('xcod', xcod);
          result.xcod = xcod;
        }
      }

      const newUrl = window.location.pathname + '?' + newParams.toString() + window.location.hash;
      window.history.replaceState({}, '', newUrl);
    }
    
    return result;
  }
  
  // Get Facebook browser cookie
  function getFbp() {
    let fbp = getCookie('_fbp');
    if (!fbp) {
      fbp = 'fb.1.' + Date.now() + '.' + Math.random().toString(36).substring(2, 15);
      setCookie('_fbp', fbp, 90);
    }
    return fbp;
  }
  
  // Cookie helpers
  function getCookie(name) {
    const value = '; ' + document.cookie;
    const parts = value.split('; ' + name + '=');
    if (parts.length === 2) return parts.pop().split(';').shift();
  }
  
  function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = 'expires=' + date.toUTCString();
    document.cookie = name + '=' + value + ';' + expires + ';path=/';
  }
  
  // Send event to server
  function sendEvent(eventName, additionalData = {}) {
    if (!config.enabledEvents.includes(eventName)) {
      return;
    }
    
    const urlParams = getUrlParams();
    const eventData = {
      token: config.token,
      events: [{
        eventName: eventName,
        eventId: 'evt_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
        visitorId: getVisitorId(),
        sessionKey: getSessionKey(),
        pageLocation: window.location.href,
        pageReferrer: document.referrer,
        userAgent: navigator.userAgent,
        fbp: getFbp(),
        fbc: urlParams.fbc || getCookie('_fbc'),
        gclid: urlParams.gclid || sessionStorage.getItem('oti_gclid'),
        utmSource: urlParams.utm_source || sessionStorage.getItem('oti_utm_source'),
        utmMedium: urlParams.utm_medium || sessionStorage.getItem('oti_utm_medium'),
        utmCampaign: urlParams.utm_campaign || sessionStorage.getItem('oti_utm_campaign'),
        utmContent: urlParams.utm_content || sessionStorage.getItem('oti_utm_content'),
        utmTerm: urlParams.utm_term || sessionStorage.getItem('oti_utm_term'),
        timestamp: new Date().toISOString(),
        ...additionalData
      }]
    };
    
    // Store UTM and tracking params in session
    Object.keys(urlParams).forEach(key => {
      if (key.startsWith('utm_') || key === 'gclid') {
        sessionStorage.setItem('oti_' + key, urlParams[key]);
      }
    });
    
    if (urlParams.fbc) {
      setCookie('_fbc', urlParams.fbc, 90);
    }
    
    // Send via fetch with fallback to image beacon
    if (typeof fetch !== 'undefined') {
      fetch(config.apiUrl + '/api/tracking/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
        keepalive: true
      }).catch(err => {
        console.warn('Otimizey tracking error:', err);
        sendViaBeacon(eventData);
      });
    } else {
      sendViaBeacon(eventData);
    }
  }
  
  // Fallback beacon method
  function sendViaBeacon(data) {
    const img = new Image(1, 1);
    img.src = config.apiUrl + '/api/tracking/pixel.gif?data=' + encodeURIComponent(JSON.stringify(data));
  }
  
  // Track page view
  function trackPageView() {
    sendEvent('PageView');
  }
  
  // Track add to cart
  function trackAddToCart(value, currency = 'BRL', contentIds = []) {
    sendEvent('AddToCart', {
      value: value,
      currency: currency,
      contentIds: contentIds
    });
  }
  
  // Track initiate checkout
  function trackInitiateCheckout(value, currency = 'BRL', contentIds = []) {
    sendEvent('InitiateCheckout', {
      value: value,
      currency: currency,
      contentIds: contentIds
    });
  }
  
  // Check if current URL matches checkout patterns
  function isCheckoutUrl(url) {
    if (!config.checkoutUrlPatterns || config.checkoutUrlPatterns.length === 0) {
      return false;
    }
    
    const urlStr = url || window.location.href;
    return config.checkoutUrlPatterns.some(pattern => {
      // Support both regex patterns and simple domain matching
      if (pattern.startsWith('/') && pattern.endsWith('/')) {
        // Regex pattern
        const regex = new RegExp(pattern.slice(1, -1));
        return regex.test(urlStr);
      } else {
        // Simple domain/path matching
        return urlStr.includes(pattern);
      }
    });
  }
  
  // Auto-track InitiateCheckout for checkout URLs
  function checkAndTrackCheckout() {
    if (config.enabledEvents.includes('InitiateCheckout') && isCheckoutUrl()) {
      // Check if we already tracked this checkout in this session
      const sessionKey = getSessionKey();
      const checkoutTrackedKey = 'oti_checkout_tracked_' + sessionKey;
      
      if (!sessionStorage.getItem(checkoutTrackedKey)) {
        trackInitiateCheckout();
        sessionStorage.setItem(checkoutTrackedKey, '1');
      }
    }
  }
  
  // Auto-track page views and check for checkout
  if (config.enabledEvents.includes('PageView')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        trackPageView();
        checkAndTrackCheckout();
      });
    } else {
      trackPageView();
      checkAndTrackCheckout();
    }
  } else if (config.enabledEvents.includes('InitiateCheckout')) {
    // Even if PageView is disabled, still check for checkout
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkAndTrackCheckout);
    } else {
      checkAndTrackCheckout();
    }
  }
  
  // Track InitiateCheckout on clicks to checkout URLs
  if (config.enabledEvents.includes('InitiateCheckout')) {
    // Set to track already processed checkout links
    const processedCheckoutLinks = new Set();
    
    // Function to check and attach listeners to new checkout links
    function checkForNewCheckoutLinks() {
      const allLinks = document.querySelectorAll('a[href]');
      
      allLinks.forEach(link => {
        if (isCheckoutUrl(link.href) && !processedCheckoutLinks.has(link)) {
          processedCheckoutLinks.add(link);
          
          // Add click listener to this specific link
          link.addEventListener('click', function(e) {
            trackInitiateCheckout();
          });
        }
      });
    }
    
    // Initial check for existing links
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkForNewCheckoutLinks);
    } else {
      checkForNewCheckoutLinks();
    }
    
    // Periodic check for new checkout links every 2 seconds
    const checkoutLinkInterval = setInterval(checkForNewCheckoutLinks, 2000);
    
    // Also keep the original click delegation as fallback
    document.addEventListener('click', function(e) {
      const target = e.target.closest('a');
      if (target && target.href && isCheckoutUrl(target.href)) {
        trackInitiateCheckout();
      }
    });
    
    // Clean up interval when page is about to unload
    window.addEventListener('beforeunload', function() {
      clearInterval(checkoutLinkInterval);
    });
  }
  
  // Expose API
  window.OtimizeyTracking = {
    trackPageView: trackPageView,
    trackAddToCart: trackAddToCart,
    trackInitiateCheckout: trackInitiateCheckout,
    sendEvent: sendEvent,
    getVisitorId: getVisitorId
  };
  
  // Listen for SPA navigation
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      trackPageView();
    }
  }).observe(document, {subtree: true, childList: true});
  
})();
