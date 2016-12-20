/**
 * Created by Igor on 12.12.2016.
 * Simple scroll lock
 */
(function () {

    var LockScroll = function () {
        this.scrollKeys = [32, 33, 34, 35, 36, 37, 38, 39, 40];
        this.isLocked = false;
    }

    // Disable scroll by middle mouse button and scrollbar
    LockScroll.prototype._handleScrollbar = function (event) {
        $(window).scrollLeft(this.lockToScrollPos[0]);
        $(window).scrollTop(this.lockToScrollPos[1]);
    };

    // Disable scroll by key pressing
    LockScroll.prototype._handleKeydown = function (event) {
        for (var i = 0; i < this.scrollKeys.length; i++) {
            if (event.keyCode === this.scrollKeys[i]) {
                event.preventDefault();
                return;
            }
        }
    };

    // Disable scroll by mouse wheel
    LockScroll.prototype._handleWheel = function (event) {
        event.preventDefault();
    };

    LockScroll.prototype.enable = function (event) {

        this.isLocked = true;

        this.lockToScrollPos = [$(window).scrollLeft(), $(window).scrollTop()];

        $(window).on("mousewheel.islider DOMMouseScroll.islider touchmove.islider", this._handleWheel);
        $(window).on("scroll.islider", this._handleScrollbar);
        $(window).on("keydown.islider", jQuery.proxy(this._handleKeydown, this));
    }

    LockScroll.prototype.disable = function (event) {
        this.isLocked = false;

        $(window).off("mousewheel.islider DOMMouseScroll.islider touchmove.islider keydown.islider scroll.islider");
    }

    window.LockScroll = LockScroll;
}())