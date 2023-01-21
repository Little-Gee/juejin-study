import packageJson from '../package.json';

const manifest: chrome.runtime.ManifestV3 = {
    manifest_version: 3,
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    background: { service_worker: 'src/background/index.js' },
    content_scripts: [
        {
            run_at: 'document_idle',
            matches: ['https://juejin.cn/*'],
            js: ['src/content/index.js'],
            css: ['src/content/index.css']
        }
    ],
    action: {
        default_popup: 'src/popup/index.html'
    },
    icons: {
        '128': 'icon.png'
    },
    permissions: ['webRequest', 'storage'],
    host_permissions: ['*://*.juejin.cn/*']
};

export default manifest;
