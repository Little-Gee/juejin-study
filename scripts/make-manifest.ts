import * as fs from 'fs';
import { resolve } from 'path';
import manifest from '../src/manifest';

const publicDir = resolve(__dirname, '..', 'public');

export default function makeManifest() {
    return {
        name: 'make-manifest',
        buildEnd() {
            if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir);
            }

            const manifestPath = resolve(publicDir, 'manifest.json');

            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

            console.log('\x1b[32m', `\nManifest file copy complete: ${manifestPath}`);
        }
    };
}
