export const baseClass = 'juejin-study';

export function matchLocation() {
    const match = window.location.pathname.match(/\/(book|video)\/(\d+)\/section\/(\d+)/);
    return match;
}
