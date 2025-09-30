// ===== LOGGER =====
class Logger {
    constructor() {
        this.maxLogEntries = 100;
    }

    add(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        try {
            const logPanel = document.getElementById('logPanel');
            if (!logPanel) {
                console.error('Log panel not found!');
                return;
            }
            
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.className = `log-${type}`;
            logEntry.textContent = `${timestamp} - ${message}`;
            logPanel.appendChild(logEntry);
            logPanel.scrollTop = logPanel.scrollHeight;

            if (logPanel.children.length > this.maxLogEntries) {
                logPanel.removeChild(logPanel.firstChild);
            }
        } catch (e) {
            console.error('Errore nel log panel:', e);
        }
    }

    clear() {
        const logPanel = document.getElementById('logPanel');
        if (logPanel) {
            logPanel.innerHTML = '';
        }
    }
}

// ===== URL MANAGER =====
class UrlManager {
    constructor(logger) {
        this.logger = logger;
    }

    cleanUrl() {
        try {
            const urlInput = document.getElementById('siteUrl');
            if (!urlInput) {
                this.logger.add('❌ Input URL non trovato', 'error');
                return;
            }
            
            const originalUrl = urlInput.value.trim();
            
            if (!originalUrl) {
                this.logger.add('Nessun URL da pulire', 'warning');
                return;
            }
            
            this.logger.add(`URL originale: ${originalUrl}`, 'info');
            const cleanedUrl = originalUrl.split('?')[0].split('#')[0];
            urlInput.value = cleanedUrl;
            this.logger.add(`✅ URL pulito: ${cleanedUrl}`, 'success');
            
            urlInput.focus();
            
        } catch (e) {
            this.logger.add(`❌ Errore nella pulizia URL: ${e.message}`, 'error');
        }
    }

    validateUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}

// ===== PROXY MANAGER =====
class ProxyManager {
    constructor(logger) {
        this.logger = logger;
        this.proxies = [
            { name: 'CorsProxy', url: 'https://corsproxy.io/?', working: false },
            { name: 'AllOrigins', url: 'https://api.allorigins.win/raw?url=', working: false },
            { name: 'CorsAnywhere', url: 'https://cors-anywhere.herokuapp.com/', working: false },
            { name: 'ThingProxy', url: 'https://thingproxy.freeboard.io/fetch/', working: false }
        ];
    }

    async findWorkingProxies() {
        const testUrls = [
            'https://httpbin.org/ip',
            'https://jsonplaceholder.typicode.com/posts/1'
        ];
        
        const working = [];
        this.logger.add('🔍 Ricerca proxy ottimizzata V5.0...', 'info');
        
        for (const proxy of this.proxies) {
            try {
                this.logger.add(`Test proxy: ${proxy.name}`, 'info');
                
                const testUrl = testUrls[0];
                const proxyUrl = this.constructProxyUrl(proxy.url, testUrl);
                
                const response = await Promise.race([
                    fetch(proxyUrl, { 
                        method: 'GET',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Accept': 'application/json'
                        }
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000))
                ]);
                
                if (response.ok) {
                    proxy.working = true;
                    working.push(proxy.url);
                    this.logger.add(`✅ Proxy verificato: ${proxy.name}`, 'success');
                } else {
                    this.logger.add(`❌ HTTP Error ${response.status} per ${proxy.name}`, 'error');
                }
            } catch (e) {
                this.logger.add(`❌ Proxy fallito: ${proxy.name} - ${e.message}`, 'error');
            }
        }
        
        this.logger.add(`📊 Ricerca completata: ${working.length}/${this.proxies.length} proxy funzionanti`, 'info');
        return working;
    }

    constructProxyUrl(proxyBase, targetUrl) {
        if (proxyBase.includes('cors-anywhere')) {
            return proxyBase + targetUrl;
        } else if (proxyBase.includes('?')) {
            return proxyBase + encodeURIComponent(targetUrl);
        } else {
            return proxyBase + targetUrl;
        }
    }

    async fetchWithNoProxy(url) {
        this.logger.add('🚀 Tentativo accesso diretto ottimizzato...', 'info');
        
        try {
            const response = await Promise.race([
                fetch(url, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9,it;q=0.8'
                    },
                    mode: 'cors'
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout accesso diretto')), 15000))
            ]);
            
            if (response.ok) {
                return await response.text();
            } else {
                throw new Error(`HTTP ${response.status} - ${response.statusText}`);
            }
        } catch (e) {
            throw new Error(`Accesso diretto fallito: ${e.message}`);
        }
    }

    // NUOVO METODO: Fetch JSON per file manifest
    async fetchJSONContent(url, proxySelect) {
        this.logger.add(`📄 Tentativo download JSON: ${url}`, 'info');
        
        let jsonData = null;
        let usedProxy = null;
        
        if (proxySelect === 'noproxy') {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'application/json, */*'
                    }
                });
                
                if (response.ok) {
                    jsonData = await response.json();
                    usedProxy = 'Accesso Diretto (NoProxy)';
                    this.logger.add(`✅ JSON scaricato con successo via NoProxy`, 'success');
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (e) {
                throw new Error(`Accesso diretto JSON fallito: ${e.message}`);
            }
        } else {
            let proxies = [];
            
            if (proxySelect === 'auto') {
                proxies = await this.findWorkingProxies();
            } else if (proxySelect === 'corsproxy') {
                proxies = ['https://corsproxy.io/?'];
            } else if (proxySelect === 'allorigins') {
                proxies = ['https://api.allorigins.win/raw?url='];
            } else if (proxySelect === 'corsanywhere') {
                proxies = ['https://cors-anywhere.herokuapp.com/'];
            } else if (proxySelect === 'thingproxy') {
                proxies = ['https://thingproxy.freeboard.io/fetch/'];
            }
            
            for (const proxy of proxies) {
                try {
                    const proxyName = this.getProxyName(proxy);
                    this.logger.add(`🧪 Tentativo JSON con proxy: ${proxyName}`, 'info');
                    
                    const proxyUrl = this.constructProxyUrl(proxy, url);
                    
                    const response = await Promise.race([
                        fetch(proxyUrl, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                                'Accept': 'application/json, */*'
                            }
                        }),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout proxy JSON')), 15000))
                    ]);
                    
                    if (response.ok) {
                        const text = await response.text();
                        jsonData = JSON.parse(text);
                        usedProxy = proxy;
                        this.logger.add(`✅ JSON scaricato con successo via ${proxyName}`, 'success');
                        break;
                    } else {
                        this.logger.add(`❌ HTTP Error ${response.status} con ${proxyName} per JSON`, 'error');
                    }
                } catch (e) {
                    this.logger.add(`❌ Proxy JSON fallito: ${e.message}`, 'error');
                    
                    if (proxySelect !== 'auto') {
                        throw new Error(`Proxy ${this.getProxyName(proxy)} non funzionante per JSON: ${e.message}`);
                    }
                }
            }
            
            if (!jsonData) {
                throw new Error('Tutti i proxy hanno fallito per il download JSON.');
            }
        }
        
        return { jsonData, usedProxy };
    }

    async fetchContent(url, proxySelect) {
        let html = null;
        let usedProxy = null;
        
        if (proxySelect === 'noproxy') {
            html = await this.fetchWithNoProxy(url);
            usedProxy = 'Accesso Diretto (NoProxy)';
            this.logger.add('✅ HTML scaricato con successo via NoProxy', 'success');
        } else {
            let proxies = [];
            
            if (proxySelect === 'auto') {
                proxies = await this.findWorkingProxies();
                this.logger.add(`📊 Ricerca completata: ${proxies.length} proxy disponibili`, 'info');
            } else if (proxySelect === 'corsproxy') {
                proxies = ['https://corsproxy.io/?'];
                this.logger.add('🌐 Uso CorsProxy predefinito', 'info');
            } else if (proxySelect === 'allorigins') {
                proxies = ['https://api.allorigins.win/raw?url='];
                this.logger.add('🔗 Uso AllOrigins predefinito', 'info');
            } else if (proxySelect === 'corsanywhere') {
                proxies = ['https://cors-anywhere.herokuapp.com/'];
                this.logger.add('🌍 Uso CorsAnywhere predefinito', 'info');
            } else if (proxySelect === 'thingproxy') {
                proxies = ['https://thingproxy.freeboard.io/fetch/'];
                this.logger.add('⚡ Uso ThingProxy predefinito', 'info');
            }
            
            for (const proxy of proxies) {
                try {
                    const proxyName = this.getProxyName(proxy);
                    this.logger.add(`🧪 Tentativo con proxy: ${proxyName}`, 'info');
                    
                    const proxyUrl = this.constructProxyUrl(proxy, url);
                    
                    const response = await Promise.race([
                        fetch(proxyUrl, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                            }
                        }),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout proxy')), 15000))
                    ]);
                    
                    if (response.ok) {
                        html = await response.text();
                        usedProxy = proxy;
                        this.logger.add(`✅ Connessione riuscita con ${proxyName} (Status: ${response.status}, Size: ${html.length} chars)`, 'success');
                        break;
                    } else {
                        this.logger.add(`❌ HTTP Error ${response.status} con ${proxyName}`, 'error');
                    }
                } catch (e) {
                    this.logger.add(`❌ Proxy fallito: ${e.message}`, 'error');
                    
                    if (proxySelect !== 'auto') {
                        throw new Error(`Proxy ${this.getProxyName(proxy)} non funzionante: ${e.message}`);
                    }
                }
            }
            
            if (!html) {
                throw new Error('Tutti i proxy hanno fallito. Prova con "NoProxy" o cambia proxy.');
            }
        }
        
        return { html, usedProxy };
    }

    getProxyName(proxyUrl) {
        const proxyMap = {
            'https://corsproxy.io/?': 'CorsProxy',
            'https://api.allorigins.win/raw?url=': 'AllOrigins',
            'https://cors-anywhere.herokuapp.com/': 'CorsAnywhere',
            'https://thingproxy.freeboard.io/fetch/': 'ThingProxy'
        };
        return proxyMap[proxyUrl] || proxyUrl.split('/')[2] || 'Unknown Proxy';
    }
}

// ===== MEDIA EXTRACTOR (MOTORE ORIGINALE PRESERVATO) =====
class MediaExtractor {
    constructor(logger) {
        this.logger = logger;
    }

    getMediaType(url) {
        const u = url.toLowerCase();
        if (/\.(jpe?g|png|gif|webp|svg|bmp|tiff?|avif|ico|heic|heif)(\?|#|$)/i.test(u)) return 'image';
        if (/\.(mp4|mov|avi|mkv|webm|m4v|3gp|flv|wmv|ogv|m3u8|ts)(\?|#|$)/i.test(u)) return 'video';
        if (/\.(mp3|wav|ogg|m4a|aac|flac|wma|opus)(\?|#|$)/i.test(u)) return 'audio';
        if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf)(\?|#|$)/i.test(u)) return 'document';
        
        // NUOVO: Riconoscimento file manifest LinkedIn
        if (/feedshare-document-master-manifest/.test(u)) return 'linkedin-manifest';
        if (/feedshare-document-transcript/.test(u)) return 'linkedin-transcript';
        if (/feedshare-document-pdf-analyzed/.test(u)) return 'linkedin-pdf';
        
        return 'unknown';
    }

    // NUOVO METODO: Estrazione avanzata con supporto LinkedIn Manifest
    async extractMediaAdvancedWithManifests(html, baseUrl, proxyManager, proxySelect) {
        const media = [];
        const seen = new Set();
        const mode = document.getElementById('extractionMode').value;
        const filters = this.getActiveFilters();
        
        this.logger.add(`🔥 AVVIO ESTRAZIONE POTENZIATA V5.0 - Modalità: ${mode.toUpperCase()}`, 'info');
        
        try {
            // 1. ESTRAZIONE STANDARD (pattern regex, DOM, etc.)
            const standardMedia = this.extractMediaAdvanced(html, baseUrl);
            standardMedia.forEach(item => {
                if (!seen.has(item.url)) {
                    seen.add(item.url);
                    media.push(item);
                }
            });
            
            this.logger.add(`✅ Estrazione standard: ${standardMedia.length} media trovati`, 'success');
            
            // 2. RICERCA SPECIFICA FILE MANIFEST LINKEDIN
            if (filters.documents || mode === 'aggressive') {
                const linkedinManifests = this.extractLinkedInManifests(html);
                this.logger.add(`🔍 Trovati ${linkedinManifests.length} file manifest LinkedIn`, 'info');
                
                let manifestCount = 0;
                for (const manifestUrl of linkedinManifests) {
                    if (!seen.has(manifestUrl) && manifestUrl.startsWith('http')) {
                        try {
                            this.logger.add(`📦 Analisi manifest: ${manifestUrl}`, 'info');
                            
                            const { jsonData, usedProxy } = await proxyManager.fetchJSONContent(manifestUrl, proxySelect);
                            const nestedMedia = await this.extractFromLinkedInManifest(jsonData, manifestUrl, seen);
                            
                            nestedMedia.forEach(item => {
                                if (!seen.has(item.url)) {
                                    seen.add(item.url);
                                    media.push(item);
                                    manifestCount++;
                                }
                            });
                            
                            this.logger.add(`✅ Manifest analizzato: ${nestedMedia.length} media estratti`, 'success');
                            
                        } catch (e) {
                            this.logger.add(`❌ Errore analisi manifest ${manifestUrl}: ${e.message}`, 'error');
                        }
                    }
                }
                
                if (manifestCount > 0) {
                    this.logger.add(`🎯 LinkedIn Manifest: ${manifestCount} media aggiuntivi estratti`, 'success');
                }
            }
            
            // 3. RIMOZIONE DUPLICATI FINALE
            const uniqueMedia = [];
            const finalSeen = new Set();
            
            media.forEach(item => {
                const cleanUrl = item.url.split('?')[0].split('#')[0];
                if (!finalSeen.has(cleanUrl) && this.isValidMediaUrl(item.url)) {
                    finalSeen.add(cleanUrl);
                    uniqueMedia.push(item);
                }
            });
            
            this.logger.add(`🎉 ESTRAZIONE COMPLETATA: ${uniqueMedia.length} media unici trovati!`, 'success');
            
            return uniqueMedia;
            
        } catch (e) {
            this.logger.add(`❌ Errore nell'estrazione avanzata: ${e.message}`, 'error');
            return media;
        }
    }

    // NUOVO METODO: Estrae URL manifest LinkedIn dall'HTML
    extractLinkedInManifests(html) {
        const manifests = [];
        
        // Pattern per file manifest LinkedIn
        const manifestPatterns = [
            /https:\/\/media\.licdn\.com\/dms\/document\/pl\/v2\/[^"'\s)]+feedshare-document-master-manifest[^"'\s)]+/gi,
            /https:\/\/media\.licdn\.com\/dms\/document\/[^"'\s)]+feedshare-document-master-manifest[^"'\s)]+/gi
        ];
        
        manifestPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                const url = match[0].replace(/['">\s}]+$/, '');
                if (url && url.includes('feedshare-document-master-manifest')) {
                    manifests.push(url);
                }
            }
        });
        
        return [...new Set(manifests)]; // Rimuove duplicati
    }

    // NUOVO METODO: Estrae media da file manifest LinkedIn
    async extractFromLinkedInManifest(jsonData, manifestUrl, seen) {
        const media = [];
        
        try {
            this.logger.add(`🔬 Analisi JSON manifest...`, 'info');
            
            // Funzione ricorsiva per cercare URL nel JSON
            const findUrlsInObject = (obj, path = '') => {
                if (!obj || typeof obj !== 'object') return;
                
                for (const [key, value] of Object.entries(obj)) {
                    const currentPath = path ? `${path}.${key}` : key;
                    
                    if (typeof value === 'string' && value.startsWith('http')) {
                        // Cerca URL specifici di LinkedIn
                        if (this.isLinkedInMediaUrl(value)) {
                            const type = this.getMediaType(value);
                            if (!seen.has(value)) {
                                media.push({
                                    url: value,
                                    alt: `LinkedIn Manifest: ${currentPath}`,
                                    source: `LinkedIn JSON (${manifestUrl})`,
                                    type: type,
                                    isCarousel: false,
                                    fromManifest: true
                                });
                            }
                        }
                    } else if (typeof value === 'object' && value !== null) {
                        findUrlsInObject(value, currentPath);
                    } else if (Array.isArray(value)) {
                        value.forEach((item, index) => {
                            if (typeof item === 'object' && item !== null) {
                                findUrlsInObject(item, `${currentPath}[${index}]`);
                            } else if (typeof item === 'string' && item.startsWith('http') && this.isLinkedInMediaUrl(item)) {
                                const type = this.getMediaType(item);
                                if (!seen.has(item)) {
                                    media.push({
                                        url: item,
                                        alt: `LinkedIn Manifest: ${currentPath}[${index}]`,
                                        source: `LinkedIn JSON (${manifestUrl})`,
                                        type: type,
                                        isCarousel: false,
                                        fromManifest: true
                                    });
                                }
                            }
                        });
                    }
                }
            };
            
            findUrlsInObject(jsonData);
            
            // Cerca specificamente le proprietà che ci interessano
            const targetProperties = [
                'transcriptManifestUrl',
                'transcribedDocumentUrl',
                'documentUrl',
                'pdfUrl',
                'transcriptUrl',
                'mediaUrl',
                'contentUrl'
            ];
            
            targetProperties.forEach(prop => {
                if (jsonData[prop] && typeof jsonData[prop] === 'string' && 
                    jsonData[prop].startsWith('http') && this.isLinkedInMediaUrl(jsonData[prop])) {
                    const type = this.getMediaType(jsonData[prop]);
                    if (!seen.has(jsonData[prop])) {
                        media.push({
                            url: jsonData[prop],
                            alt: `LinkedIn ${prop}`,
                            source: `LinkedIn JSON Property (${manifestUrl})`,
                            type: type,
                            isCarousel: false,
                            fromManifest: true
                        });
                    }
                }
            });
            
            this.logger.add(`📄 Manifest analizzato: ${media.length} media trovati nel JSON`, 'success');
            
        } catch (e) {
            this.logger.add(`❌ Errore analisi JSON manifest: ${e.message}`, 'error');
        }
        
        return media;
    }

    // NUOVO METODO: Verifica se è un URL media LinkedIn
    isLinkedInMediaUrl(url) {
        const linkedinPatterns = [
            /media\.licdn\.com\/dms\/document\/media\/v2\/.*feedshare-document-transcript/,
            /media\.licdn\.com\/dms\/document\/media\/v2\/.*feedshare-document-pdf-analyzed/,
            /media\.licdn\.com\/dms\/document\/.*\.pdf/,
            /media\.licdn\.com\/dms\/document\/.*transcript/,
            /media\.licdn\.com\/dms\/image\/.*/,
            /media\.licdn\.com\/dms\/video\/.*/
        ];
        
        return linkedinPatterns.some(pattern => pattern.test(url));
    }

    // ALGORITMO DI ESTRAZIONE POTENZIATO V5.0 - IDENTICO ALL'ORIGINALE
    extractMediaAdvanced(html, baseUrl) {
        const media = [];
        const seen = new Set();
        const mode = document.getElementById('extractionMode').value;
        const filters = this.getActiveFilters();
        
        this.logger.add(`🔥 AVVIO ESTRAZIONE POTENZIATA V5.0 - Modalità: ${mode.toUpperCase()}`, 'info');
        
        try {
            const extensivePatterns = [
                /https?:\/\/[^"'\s)}<]+\.(?:jpe?g|png|gif|webp|svg|bmp|tiff?|avif|ico|heic)(?:\?[^"'\s)}<]*)?/gi,
                /https?:\/\/[^"'\s)}<]+\.(?:mp4|mov|avi|mkv|webm|m4v|3gp|flv|wmv|ogv|m3u8|ts)(?:\?[^"'\s)}<]*)?/gi,
                /https?:\/\/[^"'\s)}<]+\.(?:mp3|wav|ogg|m4a|aac|flac|wma|opus)(?:\?[^"'\s)}<]*)?/gi,
                /https?:\/\/(?:.*\.)?(?:imgur|flickr|instagram|youtube|vimeo|soundcloud|spotify)\.com\/[^"'\s)}<]+/gi,
                /https?:\/\/[^"'\s)}<]*(?:amazonaws|cloudfront|akamai|fastly|jsdelivr)\.(?:com|net)\/[^"'\s)}<]+\.(?:jpe?g|png|gif|webp|svg|mp4|webm|mp3|wav)(?:\?[^"'\s)}<]*)?/gi,
            ];
            
            let patternCount = 0;
            extensivePatterns.forEach((pattern, i) => {
                let match;
                while ((match = pattern.exec(html)) !== null) {
                    const url = match[0].replace(/['">\s}]+$/, '');
                    if (url && !seen.has(url) && url.startsWith('http') && url.length > 10) {
                        seen.add(url);
                        const type = this.getMediaType(url);
                        if (this.shouldIncludeMedia(url, filters, type)) {
                            media.push({
                                url: url,
                                alt: `Advanced Pattern ${i + 1}`,
                                source: `Regex Pattern ${i + 1}`,
                                type: type,
                                isCarousel: false
                            });
                            patternCount++;
                        }
                    }
                }
            });
            
            this.logger.add(`✅ Pattern Regex: ${patternCount} media estratti`, 'success');
            
            let domCount = 0;
            const doc = new DOMParser().parseFromString(html, 'text/html');
            
            if (filters.images) {
                const images = doc.querySelectorAll('img[src], img[data-src], img[data-original], img[data-lazy], img[data-srcset]');
                images.forEach((img, i) => {
                    const sources = [
                        img.src,
                        img.getAttribute('data-src'),
                        img.getAttribute('data-original'),
                        img.getAttribute('data-lazy'),
                        img.getAttribute('srcset')?.split(',')[0]?.split(' ')[0]
                    ].filter(Boolean);
                    
                    sources.forEach(src => {
                        if (src && src.startsWith('http') && !seen.has(src)) {
                            seen.add(src);
                            media.push({
                                url: src,
                                alt: img.alt || `DOM Image ${i + 1}`,
                                source: 'DOM IMG Tag',
                                type: 'image',
                                isCarousel: img.closest('.carousel, .slider, .swiper, .gallery') !== null
                            });
                            domCount++;
                        }
                    });
                });
                
                if (filters.backgroundImages) {
                    const elementsWithBg = doc.querySelectorAll('*[style*="background"], div, section, header');
                    elementsWithBg.forEach((el, i) => {
                        const style = el.getAttribute('style') || '';
                        const bgMatches = style.match(/background[^:]*:\s*url\(['"]?([^'")\s]+)['"]?\)/gi);
                        if (bgMatches) {
                            bgMatches.forEach(match => {
                                const urlMatch = match.match(/url\(['"]?([^'")\s]+)['"]?\)/i);
                                if (urlMatch && urlMatch[1] && urlMatch[1].startsWith('http') && !seen.has(urlMatch[1])) {
                                    seen.add(urlMatch[1]);
                                    media.push({
                                        url: urlMatch[1],
                                        alt: `Background Image ${i + 1}`,
                                        source: 'CSS Background',
                                        type: 'image',
                                        isCarousel: false
                                    });
                                    domCount++;
                                }
                            });
                        }
                    });
                }
            }
            
            if (filters.videos) {
                const videos = doc.querySelectorAll('video[src], video source[src], video[data-src]');
                videos.forEach((vid, i) => {
                    const sources = [
                        vid.src,
                        vid.getAttribute('data-src'),
                        vid.getAttribute('poster')
                    ].filter(Boolean);
                    
                    sources.forEach(src => {
                        if (src && src.startsWith('http') && !seen.has(src)) {
                            seen.add(src);
                            media.push({
                                url: src,
                                alt: `Video Source ${i + 1}`,
                                source: 'DOM VIDEO Tag',
                                type: this.getMediaType(src),
                                isCarousel: false
                            });
                            domCount++;
                        }
                    });
                });
            }
            
            if (filters.audio) {
                const audios = doc.querySelectorAll('audio[src], audio source[src]');
                audios.forEach((aud, i) => {
                    const src = aud.src || aud.getAttribute('src');
                    if (src && src.startsWith('http') && !seen.has(src)) {
                        seen.add(src);
                        media.push({
                            url: src,
                            alt: `Audio Source ${i + 1}`,
                            source: 'DOM AUDIO Tag',
                            type: 'audio',
                            isCarousel: false
                        });
                        domCount++;
                    }
                });
            }
            
            this.logger.add(`✅ Parsing DOM: ${domCount} media estratti`, 'success');
            
            let metadataCount = 0;
            if (mode === 'aggressive') {
                const scripts = doc.querySelectorAll('script[type="application/ld+json"], script:not([src])');
                scripts.forEach(script => {
                    try {
                        if (script.type === 'application/ld+json') {
                            const data = JSON.parse(script.textContent);
                            this.extractFromJsonLD(data, media, seen);
                        } else {
                            const jsContent = script.textContent;
                            const jsUrls = jsContent.match(/https?:\/\/[^"'\s]+\.(?:jpe?g|png|gif|webp|mp4|webm|mp3|wav)(?:\?[^"'\s]*)?/gi);
                            if (jsUrls) {
                                jsUrls.forEach(url => {
                                    if (!seen.has(url)) {
                                        seen.add(url);
                                        const type = this.getMediaType(url);
                                        if (this.shouldIncludeMedia(url, filters, type)) {
                                            media.push({
                                                url: url,
                                                alt: 'JavaScript Embedded',
                                                source: 'JavaScript Code',
                                                type: type,
                                                isCarousel: false
                                            });
                                            metadataCount++;
                                        }
                                    }
                                });
                            }
                        }
                    } catch (e) {
                    }
                });
                
                const metaTags = doc.querySelectorAll('meta[property*="image"], meta[name*="image"], meta[property*="video"], meta[name*="video"]');
                metaTags.forEach(meta => {
                    const content = meta.getAttribute('content');
                    if (content && content.startsWith('http') && !seen.has(content)) {
                        seen.add(content);
                        const type = this.getMediaType(content);
                        if (this.shouldIncludeMedia(content, filters, type)) {
                            media.push({
                                url: content,
                                alt: 'Social Media Meta',
                                source: 'Meta Tag',
                                type: type,
                                isCarousel: false
                            });
                            metadataCount++;
                        }
                    }
                });
                
                this.logger.add(`✅ Metadata/JSON-LD: ${metadataCount} media estratti`, 'success');
            }
            
            let lazyCount = 0;
            if (filters.deepExtraction) {
                const lazyElements = doc.querySelectorAll('[data-src], [data-original], [data-lazy], [data-srcset], [data-bg], [data-background]');
                lazyElements.forEach((el, i) => {
                    const dataSources = [
                        el.getAttribute('data-src'),
                        el.getAttribute('data-original'),
                        el.getAttribute('data-lazy'),
                        el.getAttribute('data-srcset')?.split(',')[0]?.split(' ')[0],
                        el.getAttribute('data-bg'),
                        el.getAttribute('data-background')
                    ].filter(Boolean);
                    
                    dataSources.forEach(src => {
                        if (src && src.startsWith('http') && !seen.has(src)) {
                            seen.add(src);
                            const type = this.getMediaType(src);
                            if (this.shouldIncludeMedia(src, filters, type)) {
                                media.push({
                                    url: src,
                                    alt: `Lazy Load ${i + 1}`,
                                    source: 'Lazy Loading',
                                    type: type,
                                    isCarousel: el.closest('.carousel, .slider, .swiper, .gallery') !== null
                                });
                                lazyCount++;
                            }
                        }
                    });
                });
                
                this.logger.add(`✅ Lazy Loading: ${lazyCount} media estratti`, 'success');
            }
            
            const uniqueMedia = [];
            const finalSeen = new Set();
            
            media.forEach(item => {
                const cleanUrl = item.url.split('?')[0].split('#')[0];
                if (!finalSeen.has(cleanUrl) && this.isValidMediaUrl(item.url)) {
                    finalSeen.add(cleanUrl);
                    uniqueMedia.push(item);
                }
            });
            
            this.logger.add(`🎉 ESTRAZIONE COMPLETATA: ${uniqueMedia.length} media unici trovati!`, 'success');
            this.logger.add(`📊 Dettagli: Regex(${patternCount}) + DOM(${domCount}) + Metadata(${metadataCount}) + Lazy(${lazyCount})`, 'info');
            
            return uniqueMedia;
            
        } catch (e) {
            this.logger.add(`❌ Errore nell'estrazione avanzata: ${e.message}`, 'error');
            return media;
        }
    }
    
    extractFromJsonLD(data, media, seen) {
        try {
            if (Array.isArray(data)) {
                data.forEach(item => this.extractFromJsonLD(item, media, seen));
                return;
            }
            
            if (typeof data === 'object' && data !== null) {
                const mediaProps = ['image', 'video', 'audio', 'thumbnail', 'logo', 'photo', 'contentUrl', 'embedUrl', 'url'];
                
                mediaProps.forEach(prop => {
                    if (data[prop]) {
                        let urls = Array.isArray(data[prop]) ? data[prop] : [data[prop]];
                        urls.forEach(item => {
                            let url = typeof item === 'string' ? item : item?.url || item?.contentUrl;
                            if (url && url.startsWith('http') && !seen.has(url)) {
                                seen.add(url);
                                media.push({
                                    url: url,
                                    alt: 'JSON-LD Structured Data',
                                    source: 'JSON-LD',
                                    type: this.getMediaType(url),
                                    isCarousel: false
                                });
                            }
                        });
                    }
                });
                
                Object.values(data).forEach(value => {
                    if (typeof value === 'object') {
                        this.extractFromJsonLD(value, media, seen);
                    }
                });
            }
        } catch (e) {
        }
    }
    
    isValidMediaUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname.toLowerCase();
            
            if (pathname === '/' || pathname === '') return false;
            if (url.includes('favicon')) return false;
            if (url.includes('logo') && url.length < 50) return false;
            
            return true;
        } catch {
            return false;
        }
    }

    shouldIncludeMedia(url, filters, type) {
        const minSize = parseInt(document.getElementById('minSize').value) || 0;
        
        if (minSize > 100 && (url.includes('thumb') || url.includes('small') || url.includes('mini'))) {
            return false;
        }
        
        switch (type) {
            case 'image':
                return filters.images;
            case 'video':
                return filters.videos;
            case 'audio':
                return filters.audio;
            case 'document':
                return filters.documents;
            default:
                return filters.images;
        }
    }

    getActiveFilters() {
        return {
            images: document.getElementById('filterImg').checked,
            videos: document.getElementById('filterVideo').checked,
            audio: document.getElementById('filterAudio').checked,
            documents: document.getElementById('filterDoc').checked,
            carouselMode: document.getElementById('carouselMode').checked,
            deepExtraction: document.getElementById('deepExtraction').checked,
            backgroundImages: document.getElementById('backgroundImages').checked
        };
    }
}

// ===== UI MANAGER =====
class UIManager {
    constructor(logger) {
        this.logger = logger;
    }

    init(app) {
        this.app = app;
        this.bindEvents();
        this.logger.add('UI Manager inizializzato - Eventi collegati', 'success');
    }

    bindEvents() {
        console.log('Binding events...');
        
        const cleanBtn = document.getElementById('cleanUrlBtn');
        if (cleanBtn) {
            cleanBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Clean URL button clicked');
                this.app.urlManager.cleanUrl();
            });
            this.logger.add('✅ Pulsante Pulisci URL collegato', 'success');
        } else {
            this.logger.add('❌ Pulsante Pulisci URL non trovato', 'error');
        }

        const extractBtn = document.getElementById('extractBtn');
        if (extractBtn) {
            extractBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.app.extractContent();
            });
            this.logger.add('✅ Pulsante Analizza Sito collegato', 'success');
        }

        const urlInput = document.getElementById('siteUrl');
        if (urlInput) {
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.app.extractContent();
                }
            });
            this.logger.add('✅ Input URL collegato', 'success');
        }

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        this.logger.add('✅ Tutti gli eventi collegati correttamente', 'success');
    }

    switchTab(tabName) {
        try {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
            document.getElementById(tabName + 'Tab').classList.add('active');
            
            this.logger.add(`Cambiato tab: ${tabName}`, 'info');
        } catch (e) {
            this.logger.add(`Errore nel cambio tab: ${e.message}`, 'error');
        }
    }

    showLoading(show) {
        const loadingDiv = document.getElementById('loading');
        const extractBtn = document.getElementById('extractBtn');
        const tabsContainer = document.getElementById('tabsContainer');
        
        if (show) {
            loadingDiv.style.display = 'block';
            tabsContainer.style.display = 'none';
            extractBtn.disabled = true;
            extractBtn.innerHTML = '🔄 Estrazione in corso...';
        } else {
            loadingDiv.style.display = 'none';
            extractBtn.disabled = false;
            extractBtn.innerHTML = '🔍 Analizza Sito';
            tabsContainer.style.display = 'block';
        }
    }

    resetResults() {
        document.getElementById('mediaResults').innerHTML = '';
        document.getElementById('jsResults').innerHTML = '';
        document.getElementById('statsResults').innerHTML = '';
        document.getElementById('proxyStatus').textContent = '';
    }

    showStatus(type, message) {
        const statusDiv = document.createElement('div');
        statusDiv.className = `status ${type}`;
        statusDiv.innerHTML = message;
        document.getElementById('mediaResults').appendChild(statusDiv);
    }

    displayResults(extractionData) {
        if (extractionData.media.length) {
            this.showStatus('success', `🎉 Trovati ${extractionData.media.length} media con algoritmi V5.0! Proxy: ${extractionData.usedProxy?.split('?')[0]?.split('/').pop() || 'Diretto'}`);
            this.displayMedia(extractionData.media);
            this.displayJavaScriptAnalysis();
            this.displayStats(extractionData);
            this.switchTab('media');
        } else {
            this.showStatus('warning', '⚠️ Nessun media trovato. Prova a modificare i filtri o usa modalità "Aggressiva".');
        }
    }

    displayMedia(mediaList) {
        const container = document.getElementById('mediaResults');
        
        if (!mediaList.length) {
            container.innerHTML = '<div class="status warning">⚠️ Nessun media trovato con i filtri attuali. Prova a modificare le impostazioni di estrazione.</div>';
            return;
        }
        
        const groups = {
            'Immagini': mediaList.filter(m => m.type === 'image'),
            'Video': mediaList.filter(m => m.type === 'video'),
            'Audio': mediaList.filter(m => m.type === 'audio'),
            'Documenti': mediaList.filter(m => m.type === 'document'),
            'LinkedIn Manifest': mediaList.filter(m => m.fromManifest),
            'Altri': mediaList.filter(m => !['image', 'video', 'audio', 'document'].includes(m.type) && !m.fromManifest)
        };
        
        Object.entries(groups).forEach(([groupName, items]) => {
            if (items.length === 0) return;
            
            const groupDiv = document.createElement('div');
            groupDiv.className = 'media-group';
            
            const header = document.createElement('div');
            header.className = 'group-header';
            header.innerHTML = `<span>📁 ${groupName} (${items.length} elementi)</span>`;
            
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'toggle-group';
            toggleBtn.innerHTML = '👁️ Mostra/Nascondi';
            toggleBtn.onclick = () => {
                groupDiv.classList.toggle('group-collapsed');
                this.logger.add(`Gruppo ${groupName} ${groupDiv.classList.contains('group-collapsed') ? 'nascosto' : 'mostrato'}`, 'info');
            };
            
            header.appendChild(toggleBtn);
            
            const content = document.createElement('div');
            content.className = 'group-content media-grid';
            
            items.forEach((item, i) => {
                content.appendChild(this.createMediaCard(item, i));
            });
            
            groupDiv.appendChild(header);
            groupDiv.appendChild(content);
            container.appendChild(groupDiv);
        });
    }

    createMediaCard(media, index) {
        const card = document.createElement('div');
        card.className = 'media-card';
        
        if (media.isCarousel) {
            const badge = document.createElement('div');
            badge.className = 'carousel-badge';
            badge.textContent = 'CAROUSEL';
            card.appendChild(badge);
        }
        
        if (media.fromManifest) {
            const manifestBadge = document.createElement('div');
            manifestBadge.className = 'carousel-badge';
            manifestBadge.style.background = 'linear-gradient(135deg,#28a745,#20c997)';
            manifestBadge.textContent = 'LINKEDIN';
            manifestBadge.style.top = media.isCarousel ? '40px' : '15px';
            card.appendChild(manifestBadge);
        }
        
        const type = media.type;
        let preview;
        
        if (type === 'video') {
            preview = document.createElement('video');
            preview.src = media.url;
            preview.controls = true;
            preview.className = 'media-preview';
            preview.style.height = '200px';
        } else if (type === 'audio') {
            preview = document.createElement('audio');
            preview.src = media.url;
            preview.controls = true;
            preview.style.width = '100%';
            preview.style.height = '60px';
        } else {
            preview = document.createElement('img');
            preview.src = media.url;
            preview.className = 'media-preview';
            preview.loading = 'lazy';
            preview.onerror = () => {
                preview.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="220" viewBox="0 0 300 220"><rect width="100%" height="100%" fill="#f8f9fa"/><text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="#6c757d" font-family="Arial" font-size="14">Media non disponibile</text></svg>');
            };
        }
        
        card.appendChild(preview);
        
        const info = document.createElement('div');
        info.className = 'media-info';
        
        const urlDiv = document.createElement('div');
        urlDiv.className = 'media-url';
        urlDiv.innerHTML = `${media.url}<span class="type-badge type-${type}">${type.toUpperCase()}</span>`;
        
        if (media.source) {
            const source = document.createElement('div');
            source.className = 'media-source';
            source.textContent = `Fonte: ${media.source}`;
            urlDiv.appendChild(source);
        }
        
        info.appendChild(urlDiv);
        card.appendChild(info);
        
        const actions = document.createElement('div');
        actions.className = 'media-actions';
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'action-btn download-btn';
        downloadBtn.innerHTML = '⬇️ Download';
        downloadBtn.onclick = () => {
            const a = document.createElement('a');
            a.href = media.url;
            a.download = `media-${type}-${index + 1}`;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'action-btn copy-btn';
        copyBtn.innerHTML = '📋 Copia';
        copyBtn.onclick = async () => {
            try {
                await navigator.clipboard.writeText(media.url);
                copyBtn.innerHTML = '✅ Copiato';
                setTimeout(() => copyBtn.innerHTML = '📋 Copia', 2000);
            } catch {
                copyBtn.innerHTML = '❌ Errore';
                setTimeout(() => copyBtn.innerHTML = '📋 Copia', 2000);
            }
        };
        
        const openBtn = document.createElement('button');
        openBtn.className = 'action-btn open-btn';
        openBtn.innerHTML = '🔗 Apri';
        openBtn.onclick = () => window.open(media.url, '_blank');
        
        actions.appendChild(downloadBtn);
        actions.appendChild(copyBtn);
        actions.appendChild(openBtn);
        card.appendChild(actions);
        
        return card;
    }

    displayStats(extractionData) {
        const stats = extractionData.stats;
        const container = document.getElementById('statsResults');
        
        container.innerHTML = `
            <div class="stats-dashboard">
                <div class="stat-card">
                    <div class="stat-number">${stats.total || 0}</div>
                    <div class="stat-label">Media Totali</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.images || 0}</div>
                    <div class="stat-label">Immagini</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.videos || 0}</div>
                    <div class="stat-label">Video</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.audio || 0}</div>
                    <div class="stat-label">Audio</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.documents || 0}</div>
                    <div class="stat-label">Documenti</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.linkedinManifests || 0}</div>
                    <div class="stat-label">LinkedIn</div>
                </div>
            </div>
            <div class="js-analysis">
                <h4>📋 Dettagli Estrazione V5.0</h4>
                <p><strong>🔗 Proxy utilizzato:</strong> ${extractionData.usedProxy || 'N/A'}</p>
                <p><strong>🌐 Domini trovati:</strong> ${stats.domains || 'N/A'}</p>
                <p><strong>⚡ Modalità estrazione:</strong> ${document.getElementById('extractionMode').value.toUpperCase()}</p>
                <p><strong>🎯 Algoritmi attivi:</strong> Pattern Regex + DOM Parser + Metadata + Lazy Loading + LinkedIn Manifest</p>
                <p><strong>🔍 Fonti analizzate:</strong> IMG tags, CSS backgrounds, JSON-LD, Meta tags, Data attributes, LinkedIn JSON</p>
            </div>
        `;
    }

    displayJavaScriptAnalysis() {
        const container = document.getElementById('jsResults');
        
        container.innerHTML = `
            <div class="js-analysis">
                <h4>⚙️ Analisi JavaScript e Estrazione Avanzata</h4>
                <p><strong>🔬 Algoritmi V5.0 utilizzati:</strong></p>
                <ul style="margin: 15px 0; padding-left: 30px;">
                    <li>✅ Pattern Regex Estesi (5 pattern)</li>
                    <li>✅ DOM Parser Approfondito</li>
                    <li>✅ Analisi JSON-LD e Metadata</li>
                    <li>✅ Estrazione Background CSS</li>
                    <li>✅ Lazy Loading Detection</li>
                    <li>✅ Social Media Meta Tags</li>
                    <li>✅ LinkedIn Manifest Analysis</li>
                    <li>✅ JSON Deep Scanning</li>
                </ul>
                <p><strong>📊 Performance:</strong> Estrazione ottimizzata per massimizzare i risultati mantenendo la stabilità.</p>
                <p><strong>🎯 Raccomandazione:</strong> Per siti con contenuto dinamico, usa modalità "Aggressiva" per migliori risultati.</p>
            </div>
        `;
    }
}

// ===== ENHANCED MEDIA EXTRACTOR (APP PRINCIPALE) =====
class EnhancedMediaExtractor {
    constructor() {
        this.logger = new Logger();
        this.urlManager = new UrlManager(this.logger);
        this.proxyManager = new ProxyManager(this.logger);
        this.mediaExtractor = new MediaExtractor(this.logger);
        this.uiManager = new UIManager(this.logger);
        
        this.extractionData = { media: [], jsFiles: [], stats: {}, usedProxy: null };
    }

    init() {
        this.uiManager.init(this);
        this.logger.add('Sistema V5.0 inizializzato - Algoritmi di estrazione potenziati attivi', 'success');
        
        setTimeout(async () => {
            try {
                const proxies = await this.proxyManager.findWorkingProxies();
                this.logger.add(`✅ Sistema pronto! ${proxies.length} proxy disponibili`, 'success');
            } catch (e) {
                this.logger.add('⚠️ Avviso: Alcuni proxy potrebbero non essere disponibili', 'warning');
            }
        }, 1000);
    }

    async extractContent() {
        const url = document.getElementById('siteUrl').value.trim();
        const proxySelect = document.getElementById('proxySelect').value;
        
        this.uiManager.showLoading(true);
        this.uiManager.resetResults();
        
        this.logger.add('=== 🚀 AVVIO ESTRAZIONE POTENZIATA V5.0 ===', 'info');
        
        if (!url) {
            this.logger.add('❌ URL mancante o non valido', 'error');
            this.uiManager.showStatus('error', 'Per favore inserisci un URL valido');
            this.uiManager.showLoading(false);
            return;
        }
        
        try {
            const { html, usedProxy } = await this.proxyManager.fetchContent(url, proxySelect);
            
            // USA IL NUOVO METODO CON SUPPORTO MANIFEST
            const mediaList = await this.mediaExtractor.extractMediaAdvancedWithManifests(
                html, 
                url, 
                this.proxyManager, 
                proxySelect
            );
            
            const stats = this.calculateStats(mediaList);
            
            this.extractionData = {
                media: mediaList,
                jsFiles: [],
                stats: stats,
                usedProxy: usedProxy
            };
            
            this.uiManager.displayResults(this.extractionData);
            
            // Log riepilogativo speciale per LinkedIn
            const linkedinMedia = mediaList.filter(m => m.fromManifest);
            if (linkedinMedia.length > 0) {
                this.logger.add(`🎯 CONTENUTI LINKEDIN: ${linkedinMedia.length} file estratti dai manifest`, 'success');
            }
            
            this.logger.add(`🎉 ESTRAZIONE COMPLETATA CON SUCCESSO! ${mediaList.length} media trovati`, 'success');
            
        } catch (error) {
            this.logger.add(`❌ ERRORE FATALE: ${error.message}`, 'error');
            this.uiManager.showStatus('error', `❌ Errore: ${error.message}`);
        } finally {
            this.uiManager.showLoading(false);
        }
    }

    calculateStats(mediaList) {
        const linkedinMedia = mediaList.filter(m => m.fromManifest);
        
        return {
            total: mediaList.length,
            images: mediaList.filter(m => m.type === 'image').length,
            videos: mediaList.filter(m => m.type === 'video').length,
            audio: mediaList.filter(m => m.type === 'audio').length,
            documents: mediaList.filter(m => m.type === 'document').length,
            linkedinManifests: linkedinMedia.length,
            domains: [...new Set(mediaList.map(m => {
                try {
                    return new URL(m.url).hostname;
                } catch {
                    return 'unknown';
                }
            }))].length,
            regexPatterns: 5,
            sources: [...new Set(mediaList.map(m => m.source))].length
        };
    }

    getExtractionData() {
        return this.extractionData;
    }
}

// ===== INIZIALIZZAZIONE =====
document.addEventListener('DOMContentLoaded', () => {
    const app = new EnhancedMediaExtractor();
    app.init();
    window.app = app;
    
    window.cleanUrl = () => app.urlManager.cleanUrl();
    window.extractContent = () => app.extractContent();
});