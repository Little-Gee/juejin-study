let globalHeadings: NodeListOf<HTMLElement>;
let globalAnchors: NodeListOf<HTMLAnchorElement>;

window.addEventListener('scroll', onScroll);

function removeClass() {
    document.querySelectorAll(`.juejin-study.item`).forEach((item) => {
        item.classList.remove('active');
    });
}

function addClass(anchors: NodeListOf<HTMLAnchorElement>, id?: string) {
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
            removeClass();
            addClass(globalAnchors, globalHeadings[i].dataset.id);
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
    catalogContainer.className = 'juejin-study article-catalog';
    const fragment = document.createDocumentFragment();

    const catalogTitle = document.createElement('div');
    catalogTitle.innerText = '目录';
    catalogTitle.className = 'juejin-study catalog-title';
    fragment.appendChild(catalogTitle);

    const catalogBody = document.createElement('div');
    catalogBody.className = 'juejin-study catalog-body';

    const catalogUl = document.createElement('ul');
    catalogUl.className = 'juejin-study catalog-list';

    const liArr: {
        level: string;
        dom: HTMLLIElement;
    }[] = [];

    headings.forEach((item, i) => {
        const itemTagLevel = item.tagName.slice(-1);
        const catalogLi = document.createElement('li');
        catalogLi.className = `juejin-study item d${itemTagLevel}`;
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
            } else {
                e.returnValue = false;
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
    globalAnchors = document.querySelectorAll(`.juejin-study.article-catalog .catalog-aTag`);

    activeAnchor();
}

function handleTabUpdated() {
    const match = matchLocation();
    if (match) {
        return;
    }

    // 如果原来有目录了，则删除原来的
    const oldCatalogContainer = document.querySelector('.juejin-study.article-catalog');
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
