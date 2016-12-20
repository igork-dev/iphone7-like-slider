'use strict';

const TransitionEndEvents = {
    WebkitTransition: 'webkitTransitionEnd',
    MozTransition: 'transitionend',
    OTransition: 'oTransitionEnd otransitionend',
    transition: 'transitionend'
}

exports.transitionEndGeneral = function () {

    var tmp_element = document.createElement('tmp');

    for (var name in TransitionEndEvents) {
        if (tmp_element.style[name] !== undefined) {
            return TransitionEndEvents[name];
        }
    }

    return false;
}

exports.isSupportTransitionEnd = function () {
    return Boolean(transitionEndGeneral);
}
