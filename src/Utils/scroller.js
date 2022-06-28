export const sideScroll = (
    element,
    direction,
    speed,
    distance,
    step
) => {
    let scrollAmount = 0;
    let slideTimer = setInterval(function () {
        if (direction === "left") {
            element.scrollLeft -= step;
        } else {
            element.scrollLeft += step;
        }
        scrollAmount += step;
        if (scrollAmount >= distance) {
            window.clearInterval(slideTimer);
        }
    }, speed);
};

export const isVisible = (ele, container) => {
    const { right, width, left } = ele.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    return left <= containerRect.left
        ? containerRect.left - left <= width
        : right - containerRect.right <= width;
};