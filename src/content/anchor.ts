import { baseClass, matchLocation } from './util';

const collapsedKey = 'juejinCollapsed';

let globalHeadings: NodeListOf<HTMLElement>;
let globalAnchors: NodeListOf<HTMLAnchorElement>;

function removeActiveClass() {
    document.querySelectorAll(`.${baseClass}.item`).forEach((item) => {
        item.classList.remove('active');
    });
}

function addActiveClass(anchors: NodeListOf<HTMLAnchorElement>, id?: string) {
    for (let i = 0; i < anchors.length; i++) {
        if (anchors[i].href.split('#')[1] === id) {
            if (!anchors[i]?.parentElement?.parentElement?.classList.contains('active')) {
                removeActiveClass();
                anchors[i].parentElement?.parentElement?.classList.add('active');
            }
            break;
        }
    }
}

// 设置高亮
function activeAnchor() {
    for (let i = globalHeadings.length - 1; i >= 0; i--) {
        // i === 0，初始化时没有滚动，高度不够，默认高亮第一个
        if (document.documentElement.scrollTop >= globalHeadings[i].offsetTop - 96 || i === 0) {
            addActiveClass(globalAnchors, globalHeadings[i].dataset.id);
            break;
        }
    }
}

export function handleAnchorActive() {
    if (!globalHeadings || !globalAnchors) {
        return;
    }
    activeAnchor();
}

function appendSkeleton() {
    const fragment = document.createDocumentFragment();

    const skeleton = document.createElement('div');
    skeleton.className = `${baseClass} catalog-skeleton`;

    for (let i = 0; i < 4; i++) {
        const skeletonLine = document.createElement('div');
        skeletonLine.className = `${baseClass} catalog-skeleton-line`;
        skeleton.appendChild(skeletonLine);
    }
    fragment.appendChild(skeleton);

    const catalogBody = document.querySelector(`.${baseClass}.catalog-body`);
    if (catalogBody?.firstChild) {
        catalogBody.removeChild(catalogBody.firstChild);
    }
    catalogBody?.appendChild(fragment);
}

function appendCatalogList(headings: NodeListOf<HTMLElement>) {
    const fragment = document.createDocumentFragment();

    const catalogUl = document.createElement('ul');
    catalogUl.className = `${baseClass} catalog-list`;
    fragment.appendChild(catalogUl);

    const liArr: {
        level: string;
        dom: HTMLLIElement;
    }[] = [];

    headings.forEach((item, i) => {
        const itemTagLevel = item.tagName.slice(-1);
        const catalogLi = document.createElement('li');
        catalogLi.className = `${baseClass} item d${itemTagLevel}`;
        const aContainer = document.createElement('div');
        aContainer.className = 'a-container';
        const a = document.createElement('a');
        a.className = 'catalog-aTag';
        a.href = `#${item.dataset.id}`;
        a.title = item.innerText;
        a.innerText = item.innerText;
        a.onclick = function (e) {
            if (e.preventDefault) {
                e.preventDefault();
            }

            const top = item.getBoundingClientRect().top;
            document.documentElement.scrollTop = document.documentElement.scrollTop + top - 90;
        };
        aContainer.appendChild(a);
        catalogLi.appendChild(aContainer);

        liArr.push({
            level: itemTagLevel,
            dom: catalogLi
        });

        for (let j = i - 1; j >= 0; j--) {
            const prevItem = liArr[j];
            if (prevItem.level < itemTagLevel) {
                prevItem.dom.appendChild(catalogLi);
                break;
            }

            if (j === 0) {
                catalogUl.appendChild(catalogLi);
            }
        }

        if (i === 0) {
            catalogUl.appendChild(catalogLi);
        }
    });

    const catalogBody = document.querySelector(`.${baseClass}.catalog-body`);
    if (catalogBody?.firstChild) {
        catalogBody.removeChild(catalogBody.firstChild);
    }
    catalogBody?.appendChild(fragment);
}

async function appendCatalogContainer() {
    const fragment = document.createDocumentFragment();

    const catalogContainer = document.createElement('div');
    const storage = await chrome.storage.local.get(collapsedKey);
    const collapsed = storage[collapsedKey];
    catalogContainer.className = `${baseClass} article-catalog${!!collapsed ? ' collapsed' : ''}`;
    fragment.appendChild(catalogContainer);

    const toggleContainer = document.createElement('div');
    toggleContainer.className = `${baseClass} catalog-toggle-container`;
    toggleContainer.onclick = function (e) {
        if (e.target instanceof Element) {
            if (e.target.parentElement?.classList.contains('collapsed')) {
                e.target.parentElement.classList.remove('collapsed');
                chrome.storage.local.remove(collapsedKey);
            } else {
                e.target.parentElement?.classList.add('collapsed');
                chrome.storage.local.set({ [collapsedKey]: true });
            }
        }
    };
    const toggle = document.createElement('div');
    toggle.innerText = '❯';
    toggle.className = `${baseClass} catalog-toggle`;
    toggleContainer.appendChild(toggle);
    catalogContainer.appendChild(toggleContainer);

    const catalogTitle = document.createElement('div');
    catalogTitle.innerText = '目录';
    catalogTitle.className = `${baseClass} catalog-title`;
    catalogContainer.appendChild(catalogTitle);

    const catalogBody = document.createElement('div');
    catalogBody.className = `${baseClass} catalog-body`;
    catalogContainer.appendChild(catalogBody);

    document.body.appendChild(fragment);
}

// 默认有 100 延迟是因为使用浏览器前进后退时，获取到的标题不是最新的，暂时没想到好的办法
function getHeadingsWithDelay(delay = 200) {
    return new Promise<NodeListOf<HTMLElement>>((resolve) => {
        setTimeout(() => {
            const headings = document.querySelectorAll<HTMLElement>(
                '.article-content .markdown-body h1, h2, h3, h4, h5'
            );
            resolve(headings);
        }, delay);
    });
}

async function getHeadings() {
    const headings = await getHeadingsWithDelay();

    if (!headings.length) {
        // 防止没拿到，再试一次
        const res = await getHeadingsWithDelay(1000);
        return res;
    }

    return headings;
}

export async function handleCatalogContent() {
    const match = matchLocation();
    if (!match) {
        return;
    }

    // 获取所有标题
    const headings = await getHeadings();
    if (!headings.length) {
        const catalogBody = document.querySelector(`.${baseClass}.catalog-body`);
        if (catalogBody?.firstChild) {
            catalogBody.removeChild(catalogBody.firstChild);
        }
        const emptyTip = document.createElement('div');
        emptyTip.innerText = '没有获取到';
        emptyTip.className = `${baseClass} catalog-empty`;
        catalogBody?.appendChild(emptyTip);
        return;
    }

    // 显示目录
    appendCatalogList(headings);

    globalHeadings = headings;
    globalAnchors = document.querySelectorAll(`.${baseClass}.article-catalog .catalog-aTag`);

    activeAnchor();
}

export async function handleCatalogContainer() {
    const match = matchLocation();
    const oldCatalogContainer = document.querySelector(`.${baseClass}.article-catalog`);
    if (!match) {
        if (oldCatalogContainer) {
            oldCatalogContainer.remove();
        }

        return;
    }

    if (!oldCatalogContainer) {
        await appendCatalogContainer();
    }

    appendSkeleton();
}
