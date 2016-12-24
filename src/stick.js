(function() {

    'use strict'
    /**
     * Simple stick realization
     * @options {}
     *  element - element which need to be sticked
     *  distance - distance where sticked element can be sticked
     *  marginTop - margin from the top of the screen
     *  (under construction)offset - distance where sticked element begin to hide
     *  (under construction)offsetHandler - handler which work during offset distance
     */
    var Stick = function(options) {

        this.element = options.element;
        this.parentElement = options.parentElement;
        this.marginInSection = options.marginInSection;
        this.marginInFixed = options.marginInFixed;
        this.offset = options.offset
        this.offsetHandler = options.offsetHandler;

        this._marginBottomInSection = 20;
    }

    // Turn on sticking
    Stick.prototype.enableListener = function () {

        // Save element position
        this._parentTop = this.parentElement.offset().top;
        this._distance = this.parentElement.prop('scrollHeight');

        this.element.css("margin-top", this.marginInSection);
        this.isStick = false;

        jQuery(window).on("scroll", jQuery.proxy(this.checkFixed, this));
    }

    // Turn off sticking
    Stick.prototype.disableListener = function () {
        // Remove "position" prop, in case of closing section during sticking
        this.element.css("position", "");
        this.element.css("top", "");
        jQuery(window).off("scroll", this.checkFixed);
    }

    Stick.prototype.checkFixed = function () {

        // Start point of sticked element
        var startPos =
            this._parentTop
            + this.marginInSection
            - this.marginInFixed;

        // Finish point of sticked element
        var finishPos =
            this._parentTop
            + this._distance
            - this.element.height()
            - this.marginInFixed
            - this._marginBottomInSection;

        // Screen top
        var windowCurrTop = jQuery(window).scrollTop();

        // If sticked element is on the screen, than it is not need to be stick
        if (this.isStick && windowCurrTop < startPos) {

            this.element.css("position", "");
            this.element.css( "top", "" );
            this.element.css("margin-top", this.marginInSection);

            this.isStick = false;

        // If sticked element is on "distance" than it sticks to top of the screen
        } else if (!this.isStick && (windowCurrTop >= startPos) && (windowCurrTop < finishPos)) {

            this.element.css("position", "fixed");
            this.element.css( "top", 0 );
            this.element.css("marginTop", this.marginInFixed);

            this.isStick = true;

        // If sticked element out of distance than fix them on the end with absolute position
        } else if (this.isStick && ( windowCurrTop >= finishPos )) {

            this.element.css("position", "absolute");
            this.element.css("top", finishPos );
            this.isStick = false;
        }
    }

    // Make it global
    window.Stick = Stick;
}())