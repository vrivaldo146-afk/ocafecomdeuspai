(function () {
  let currentParams = window.location.search;
  let currentHash = window.location.hash;
  let currentPathname = window.location.pathname;
  
  if (!currentParams) return;
  
  function appendParams(url, params) {
    if (!url || url.startsWith('#') || url.startsWith('javascript:') || 
        url.startsWith('mailto:') || url.startsWith('tel:')) {
      return url;
    }
    
    try {
      const urlObj = new URL(url, window.location.origin);
      const existingParams = new URLSearchParams(params.slice(1));
      
      existingParams.forEach((value, key) => {
        urlObj.searchParams.set(key, value);
      });
      
      return urlObj.toString();
    } catch (e) {
      // Fallback para URLs relativas
      const hasQuery = url.includes('?');
      const separator = hasQuery ? '&' : '?';
      return url + separator + params.slice(1);
    }
  }
  
  function updateLinks() {
    const params = window.location.search;
    if (!params) return;
    
    document.querySelectorAll('a[href]').forEach(anchor => {
      const originalHref = anchor.getAttribute('data-original-href') || anchor.href;
      
      // Armazena o href original na primeira vez
      if (!anchor.hasAttribute('data-original-href')) {
        anchor.setAttribute('data-original-href', anchor.href);
      }
      
      const newHref = appendParams(originalHref, params);
      if (anchor.href !== newHref) {
        anchor.href = newHref;
      }
    });
  }
  
  // Função para detectar mudanças na URL e atualizar links
  function checkAndUpdate() {
    const newParams = window.location.search;
    const newHash = window.location.hash;
    const newPathname = window.location.pathname;
    
    // Atualiza variáveis de controle
    if (newParams !== currentParams || 
        newHash !== currentHash || 
        newPathname !== currentPathname) {
      
      currentParams = newParams;
      currentHash = newHash;
      currentPathname = newPathname;
    }
    
    // Sempre atualiza os links a cada 500ms
    updateLinks();
  }
  
  // Executa inicialmente
  updateLinks();
  
  // Atualiza links a cada 500ms SEMPRE
  setInterval(checkAndUpdate, 500);
  
  // Monitora mudanças no título (útil para SPAs)
  const titleObserver = new MutationObserver(updateLinks);
  const titleElement = document.querySelector('head > title');
  if (titleElement) {
    titleObserver.observe(titleElement, {
      subtree: true,
      characterData: true,
      childList: true
    });
  }
  
  // Eventos de navegação
  window.addEventListener('popstate', updateLinks);
  window.addEventListener('hashchange', updateLinks);
  
  // Intercepta pushState e replaceState
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function() {
    originalPushState.apply(this, arguments);
    updateLinks();
  };
  
  history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    updateLinks();
  };
  
  // Observer para novos elementos DOM
  const domObserver = new MutationObserver((mutations) => {
    let hasNewLinks = false;
    
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) { // Element node
          if (node.tagName === 'A' || node.querySelectorAll('a[href]').length > 0) {
            hasNewLinks = true;
          }
        }
      });
    });
    
    if (hasNewLinks) {
      updateLinks();
    }
  });
  
  domObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Detecta mudanças via click em links
  document.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' || e.target.closest('a')) {
      setTimeout(updateLinks, 100);
    }
  }, true);
  
})();
