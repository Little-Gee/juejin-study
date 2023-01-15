let globalHeadings: NodeListOf<HTMLElement>;
let globalAnchors: NodeListOf<HTMLAnchorElement>;
const baseClass = 'juejin-study';

window.addEventListener('scroll', onScroll);

function removeActiveClass() {
    document.querySelectorAll(`.${baseClass}.item`).forEach((item) => {
        item.classList.remove('active');
    });
}

function addActiveClass(anchors: NodeListOf<HTMLAnchorElement>, id?: string) {
    for (let i = 0; i < anchors.length; i++) {
        if (anchors[i].href.split('#')[1] === id) {
            anchors[i]?.parentElement?.parentElement?.classList.add('active');
            break;
        }
    }
}

// 设置高亮
function activeAnchor() {
    for (let i = globalHeadings.length - 1; i >= 0; i--) {
        // i === 0，初始化时没有滚动，高度不够，默认高亮第一个
        if (document.documentElement.scrollTop >= globalHeadings[i].offsetTop - 96 || i === 0) {
            removeActiveClass();
            addActiveClass(globalAnchors, globalHeadings[i].dataset.id);
            break;
        }
    }
}

function onScroll() {
    if (!globalHeadings || !globalAnchors) {
        return;
    }
    activeAnchor();
}

function appendCatalog(headings: NodeListOf<HTMLElement>) {
    const catalogContainer = document.createElement('div');
    catalogContainer.className = `${baseClass} article-catalog`;
    const fragment = document.createDocumentFragment();

    const toggleContainer = document.createElement('div');
    toggleContainer.className = `${baseClass} catalog-toggle-container`;
    toggleContainer.onclick = function (e) {
        if (e.target instanceof Element) {
            if (e.target.parentElement?.classList.contains('collapsed')) {
                e.target.parentElement.classList.remove('collapsed');
            } else {
                e.target.parentElement?.classList.add('collapsed');
            }
        }
    };
    const toggle = document.createElement('div');
    toggle.innerText = '❯';
    toggle.className = `${baseClass} catalog-toggle`;
    toggleContainer.appendChild(toggle);
    fragment.appendChild(toggleContainer);

    const catalogTitle = document.createElement('div');
    catalogTitle.innerText = '目录';
    catalogTitle.className = `${baseClass} catalog-title`;
    fragment.appendChild(catalogTitle);

    const catalogBody = document.createElement('div');
    catalogBody.className = `${baseClass} catalog-body`;

    const catalogUl = document.createElement('ul');
    catalogUl.className = `${baseClass} catalog-list`;

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

    catalogBody.appendChild(catalogUl);
    fragment.appendChild(catalogBody);

    catalogContainer.appendChild(fragment);
    document.body.appendChild(catalogContainer);
}

function getAllHeadings(): NodeListOf<HTMLElement> {
    return document.querySelectorAll('.article-content .markdown-body h1, h2, h3, h4, h5');
}

function getHeadingsWithDelay() {
    return new Promise<NodeListOf<HTMLElement> | false>((resolve, reject) => {
        setTimeout(() => {
            const headings = getAllHeadings();
            if (!headings.length) {
                resolve(false);
                return;
            }
            resolve(headings);
        }, 1000);
    });
}

async function getHeadings() {
    const headings = getAllHeadings();

    if (!headings.length) {
        // 防止没拿到，再试一次
        const res = await getHeadingsWithDelay();
        return res;
    }

    return headings;
}

function matchLocation() {
    const match = window.location.pathname.match(/\/book\/(\d*)\/section\/(\d*)/);
    return match;
}

async function handleGetBookData() {
    const match = matchLocation();
    if (!match) {
        return;
    }

    // 获取所有标题
    const headings = await getHeadings();

    if (!headings) {
        return;
    }

    // 显示目录
    appendCatalog(headings);

    globalHeadings = headings;
    globalAnchors = document.querySelectorAll(`.${baseClass}.article-catalog .catalog-aTag`);

    activeAnchor();
}

function handleTabUpdated() {
    const match = matchLocation();
    if (!match) {
        return;
    }

    // 如果原来有目录了，则删除原来的
    const oldCatalogContainer = document.querySelector(`.${baseClass}.article-catalog`);
    if (oldCatalogContainer) {
        oldCatalogContainer.remove();
    }
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.msg === 'tabOnUpdated') {
        handleTabUpdated();
    }
    if (request.msg === 'getBookData') {
        handleGetBookData();
    }
});
