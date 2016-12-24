require("./stick");
require("./LockScroll");
var utils = require("./utils")

// Global collection of sliders
var iSliderItems = [];
var lockScroll = new window.LockScroll();
const positions = {
        FULLY_ABOVE: "fullyAbove"
        , ONLY_BOTTOM_ON_SCREEN: "onlyBottomOnScreen"
        , FULLY_ON_SCREEN:"fullyOnScreen"
        , FULLY_COVER_SCREEN:"fullyCoverScreen"
        , ONLY_TOP_ON_SCREEN:"onlyTopOnScreen"
        , FULLY_BELOW:"fullyBelow"
    };
const CLOSE_BUTTON_OPACITY = 0.4;

(function ($) {

    var ISlider = function (elem, options) {

        this.id = iSliderItems.length;

        iSliderItems.push(this);

        this._hiddenSection = $(elem);
        this.openButton = $(options.button);
        this.marginInSection = options.marginInSection ? options.marginInSection : 30;
        this.marginInFixed = options.marginInFixed ? options.marginInFixed : 30;

        this.sections = "header, footer, section, article, :header, p, blockquote, div";

        this.isOpened = false;
        this._isTopClosing = false;
        this._isBottomClosing = false;

        this._AfterClosed = undefined;
    };

    ISlider.prototype.init = function () {

        var prevAllWithParents = this.GetPrevAllWithParents();
        var nextAllWithParents = this.GetNextAllWithParents();
        var prevSection = prevAllWithParents.first();
        var nextSection = nextAllWithParents.first();

        // Remove gaps around hidden section, it's necessary
        prevSection.css("marginBottom", 0);
        // Fix HEADERS margins
        /* alternative, of "overflow: hidden" to not eliminate :after and :before */
        prevSection.css("display", "inline-block");
        prevSection.css("width", "100%");

        nextSection.css("marginTop", 0);
        nextSection.css("display", "inline-block");
        nextSection.css("width", "100%");

        // Remove gaps in hidden section, it's necessary
        this._hiddenSection.css("marginTop", 0);
        this._hiddenSection.css("marginBottom", 0);
        this._hiddenSection.css("paddingTop", 0);
        this._hiddenSection.css("paddingBottom", 0);
        this._hiddenSection.css("overflow", "hidden");

        // Closing hiddenSection
        this._hiddenSection.addClass("collapsed");

        // Need to be after overflow:hidden
        var hiddenSectionHeight = this._hiddenSection.prop('scrollHeight');

        // Cover gaps which produced by paddings and margins
        var coverBeforeTranslateY = -hiddenSectionHeight - parseInt(prevSection.css("paddingBottom"));
        var coverAfterTranslateY = parseInt(nextSection.css("paddingTop"));

        // Creating classes to cover gaps
        $('<style>' +
            '.coverBefore' + this.id + ':before{' +
            'content:"";' +
            'height: ' + hiddenSectionHeight + 'px;' +
            'background-color: white;' +
            'display: block;' +
            'position: absolute;' +
            'width: 100%;' +
            'transform: translate3d(0, ' + coverBeforeTranslateY + 'px, 0); ' +
            '}' +
            '.coverAfter' + this.id + ':after{' +
            'content:"";' +
            'height: ' + hiddenSectionHeight + 'px;' +
            'background-color: white;' +
            'position: absolute;' +
            'display: block;' +
            'width: 100%;' +
            'z-index: 1;' +
            'transform: translate3d(0, ' + coverAfterTranslateY + 'px, 0); ' +
            '}' +
            '</style>').appendTo('head');

        // We cannot cover the next section, so we made this manually
        if (nextSection.css("background-color") == "rgba(0, 0, 0, 0)" && nextSection.css("background-image") == "none") {
            nextSection.css("background-color", "white");
        }
        if (prevSection.css("background-color") == "rgba(0, 0, 0, 0)" && prevSection.css("background-image") == "none") {
            prevSection.css("background-color", "white");
        }

        this.closeButton = $("<div class='isliderCloseButtonWrapper'><img src='img/plus.png' class='isliderCloseButton'></div>");
        this._hiddenSection.prepend(this.closeButton);

        // Stick button to the top of the screen when user move through hidden section
        this.stick = new window.Stick({
            element: this.closeButton
            , parentElement: this._hiddenSection
            , marginInSection: this.marginInSection
            , marginInFixed: this.marginInFixed
        });
        this.closeButton.css("display", "none");
        // add proper cursor
        this.openButton.addClass("isliderOpenButton");

        var _self = this;
        this.openButton.on("click", function (e) {
            e.preventDefault();

            if ( _self.openButton.css("opacity") < 1 || lockScroll.isLocked ) return;

            // Test if we have another opened slide. If yes - closing it
            var isOtherOpened = false;
            iSliderItems.forEach(function (e) {

                if (e.isOpened) {
                    // Firstly close anther slider
                    // If another slide is out of screen - close them instantly
                    if( e._GetHiddenSectionState() == positions.FULLY_ABOVE || e._GetHiddenSectionState() == positions.FULLY_BELOW ) {
                        // If hidden section is above screen, we need to fix scroll
                        var isFixScroll = (e._GetHiddenSectionState() == positions.FULLY_ABOVE);
                        e.InstantCloseRow( isFixScroll );
                        //redraw hack
                        var redraw = this.offsetHeight;
                        _self.OpenRow();
                    } else {
                        e.CloseRow(
                            //Open after closing
                            function () {
                                _self.OpenRow();
                            }
                        )
                    }
                    isOtherOpened = true;
                }
            })

            // If there is no opened slides - just open current
            if( !isOtherOpened ) _self.OpenRow();
        });

        var closeButtonImage = this.closeButton.find(".isliderCloseButton");
        closeButtonImage.on("click", function (e) {
            e.preventDefault();

            if ( _self.closeButton.css("opacity") < CLOSE_BUTTON_OPACITY || lockScroll.isLocked) return;

            _self.CloseRow();
        });
    };

    ISlider.prototype.OpenRow = function () {

        // if animation in process - return
        lockScroll.enable();
        this.stick.enableListener();

        this.openButton.fadeTo(400, 0, function () {
            $(this).css("visibility", "hidden");
        });

        this.PushNextAll();
    }

    ISlider.prototype.CloseRow = function (AfterClosed) {

        this._AfterClosed = AfterClosed;
        lockScroll.enable();

        this.closeButton.fadeTo(400, 0, function () {
            $(this).css("visibility", "hidden");
        });

        var hiddenBoxTop = this._hiddenSection.offset().top;
        var hiddenBoxBottom = this._hiddenSection.offset().top + this._hiddenSection.height();

        var targetPosition;

        // If we can see top of hiddenSection and can't see bottom, than move bottom section to top
        // If we can see whole hidden section, than move bottom section to top
        if ( this._GetHiddenSectionState() == positions.ONLY_TOP_ON_SCREEN || this._GetHiddenSectionState() == positions.FULLY_ON_SCREEN ) {
            targetPosition = hiddenBoxTop;
            // If we can see bottom of hiddenSection and can't see top, than move top section to bottom
        } else if (this._GetHiddenSectionState() == positions.ONLY_BOTTOM_ON_SCREEN ) {
            targetPosition = hiddenBoxBottom;
            // If top and bottom of hidden section is out of screen, than move top and bottom sections to 2/3 of screen.
        } else {
            targetPosition = $(window).scrollTop() + $(window).height() * 0.7;
        }

        // If there is no place to scrolling below, than move line of contact
        var targetBottomHeight = ($(window).scrollTop() + $(window).height()) - targetPosition;
        var nextSectionsHeight = $(document).height() - (this._hiddenSection.offset().top + this._hiddenSection.height());

        if (nextSectionsHeight < targetBottomHeight) {
            targetPosition += (targetBottomHeight - nextSectionsHeight);
        }

        // If there is no place to scrolling above, than move line of contact
        var prevSectionsHeight = this._hiddenSection.offset().top;
        var targetTopHeight = targetPosition - $(window).scrollTop();

        if (prevSectionsHeight < targetTopHeight) {
            targetPosition -= (targetTopHeight - prevSectionsHeight);
        }

        this.PullPrevAll(targetPosition);
        this.PullNextAll(targetPosition);
    }

    ISlider.prototype.InstantCloseRow = function ( isFixScroll ) {

        this.closeButton.css("opacity", 0).css("visibility", "hidden");
        this.openButton.css("opacity", 1).css("visibility", "visible");

        if( isFixScroll ) {
            var deltaFinishPos = this._hiddenSection.height()
            $(window).scrollTop($(window).scrollTop() - deltaFinishPos);
            var redraw = this.offsetHeight;
        }

        this._onSectionsClosed();
    }

    ISlider.prototype._GetHiddenSectionState = function () {

        var hiddenSectTop = this._hiddenSection.offset().top;
        var hiddenSectBottom = this._hiddenSection.offset().top + this._hiddenSection.height();
        var screenTop = $(window).scrollTop();
        var screenBottom = $(window).scrollTop() + $(window).height();

        if( hiddenSectBottom <= screenTop ) {
            return positions.FULLY_ABOVE;
        } else if( hiddenSectTop <= screenTop && hiddenSectBottom >= screenTop && hiddenSectBottom <= screenBottom ) {
            return positions.ONLY_BOTTOM_ON_SCREEN;
        } else if( hiddenSectTop >= screenTop && hiddenSectBottom <= screenBottom ) {
            return positions.FULLY_ON_SCREEN;
        } else if( hiddenSectTop <= screenTop && hiddenSectBottom >= screenBottom ) {
            return positions.FULLY_COVER_SCREEN;
        } else if( hiddenSectTop >= screenTop && hiddenSectTop <= screenBottom && hiddenSectBottom >= screenBottom) {
            return positions.ONLY_TOP_ON_SCREEN;
        } else {
            return positions.FULLY_BELOW;
        }
    }

    ISlider.prototype._onSectionsClosed = function () {
        this.isOpened = false;
        this._hiddenSection.addClass("collapsed");
        this.stick.disableListener();

        var hasAfterClosed = this._AfterClosed != undefined;

        if (!hasAfterClosed) lockScroll.disable();
        this.openButton.css("visibility", "visible").fadeTo(400, 1);

        if (hasAfterClosed) {
            this._AfterClosed();
            this._AfterClosed = undefined;
        }
    }

    ISlider.prototype._onSectionsOpened = function () {
        this.isOpened = true;

        lockScroll.disable();
        this.closeButton.css("visibility", "visible").fadeTo(400, CLOSE_BUTTON_OPACITY);
    }

    ISlider.prototype.GetPrevAllWithParents = function () {

        var currentElement = $(this._hiddenSection);
        var elements = $();

        for (var i = 0; i < 50; i++) // infinity loop
        {
            $.merge(elements, currentElement.prevAll(this.sections)); // specific elements above current
            currentElement = $(currentElement).parent(); // any type of parent, not specific
            if (currentElement.length == 0) {
                break;
            }
        }

        return elements;
    }

    ISlider.prototype.GetNextAllWithParents = function () {

        var currentElement = $(this._hiddenSection);
        var elements = $();

        for (var i = 0; i < 50; i++) // infinity loop
        {
            $.merge(elements, currentElement.nextAll(this.sections));
            currentElement = $(currentElement).parent();
            if (currentElement.length == 0) {
                break;
            }
        }

        return elements;
    }

    ISlider.prototype.PushNextAll = function () {

        var nextSections = this.GetNextAllWithParents();
        var nextSection = nextSections.first();

        // To protect from errors
        if (nextSection.length == 0) return;

        this._hiddenSection.removeClass("collapsed");

        // Initial position of sections
        var deltaStartPos = -this._hiddenSection.prop('scrollHeight');

        var bottomScreen = $(window).scrollTop() + $(window).height();

        var deltaFinishPos;
        // If next sections position is out of the screen ( position counted without transform )
        if (nextSection.offset().top > bottomScreen) {
            // Than move section with animation to screen bottom and than instantly go to own position
            deltaFinishPos = deltaStartPos + (bottomScreen - this._hiddenSection.offset().top);
        } else {
            // Else sections position position is on the screen and we move with animation to it
            deltaFinishPos = 0;
        }

        // Cover margin/padding gaps
        $(nextSection).addClass('coverAfter' + this.id);

        nextSections.each(function (index) {

            /* Define start position */
            $(this).css("transform", "translate3d(0px, " + deltaStartPos + "px,0px)");
            // redraw hack to correct animations. Need to be for each section
            var redraw = this.offsetHeight;

            $(this).addClass("sectionAnimation");
            $(this).css("transform", "translate3d(0px, " + deltaFinishPos + "px,0px)");

            $(this).one(utils.transitionEndGeneral(), function (e) {
                $(this).removeClass("sectionAnimation");
                $(this).css("transform", '');
            })
        })

        var _self = this;
        nextSection.one(utils.transitionEndGeneral(), function (e) {
            $(nextSection).removeClass('coverAfter' + _self.id);
            _self._onSectionsOpened();
        })
    }

    /**
     * Move all top sections to target position
     * @param {Number} targetPosition - position where top and bottom sections connects
     */
    ISlider.prototype.PullPrevAll = function (targetPosition) {

        var prevSections = this.GetPrevAllWithParents();
        var prevSection = prevSections.first();

        // To protect from errors
        if (prevSection.length == 0) return;

        var currentPrevBottom = prevSection.offset().top + prevSection.outerHeight();

        // If sections is already on place - we don't need to move them
        if (targetPosition == currentPrevBottom) return;

        var deltaStartPos = $(window).scrollTop() - currentPrevBottom;
        var deltaFinishPos = targetPosition - currentPrevBottom;

        var isOutOfScreen = ( prevSection.offset().top + prevSection.height()) < $(window).scrollTop();

        // Cover gaps from margins and paddings. Class described in init func
        $(prevSection).addClass('coverBefore' + this.id);

        this._isTopClosing = true;

        prevSections.each(function (index) {

            if ($(this).css("position") == "fixed") {
                if ($(this).css("z-index") == "auto") {
                    $(this).css("z-index", 10);
                    $(this).addClass("islider-z-changed");
                }

            } else {

                // If bottom of preview section is above screen, than instantly move it to screen border
                if (isOutOfScreen) {
                    $(this).css("transform", "translate3d(0px, " + deltaStartPos + "px,0px)");
                }

                if (!$(this).is(prevSection)) {
                    $(this).css("z-index", 1);
                    $(this).css("position", "relative");
                }

                // redraw hack to correct animations
                var redraw = this.offsetHeight;

                $(this).addClass("sectionAnimation");
                //$(this).css("transition-duration", "1s");

                $(this).css("transform", "translate3d(0px, " + deltaFinishPos + "px,0px)");

                $(this).one(utils.transitionEndGeneral(), function (e) {
                    $(this).removeClass("sectionAnimation");
                    $(this).css("transform", '');
                    if (!$(this).is(prevSection)) {
                        $(this).css("z-index", '');
                    }
                    $(this).css("position", "");
                    $(this).css("transition-duration", "");
                })

            }
        })

        var _self = this;
        prevSection.one(utils.transitionEndGeneral(), function (e) {
            $(window).scrollTop($(window).scrollTop() - deltaFinishPos);
            $(prevSection).removeClass('coverBefore' + _self.id);

            $(".islider-z-changed").each(function (e) {
                $(this).removeClass("islider-z-changed");
                $(this).css("z-index", 'auto');
            })

            _self._isTopClosing = false;
            if (!_self._isTopClosing && !_self._isBottomClosing) _self._onSectionsClosed();
        })
    }

    /**
     * Move all bottom sections to target position
     * @param {Number} targetPosition - position where top and bottom sections connects
     */
    ISlider.prototype.PullNextAll = function (targetPosition) {

        var nextSections = this.GetNextAllWithParents();
        var nextSection = nextSections.first();

        // To protect from errors
        if (nextSection.length == 0) return;

        var nextOuterTop = nextSection.offset().top;

        if (targetPosition == nextOuterTop) return;

        var deltaStartPos = ($(window).scrollTop() + $(window).height()) - nextOuterTop;
        var deltaFinishPos = targetPosition - nextOuterTop;

        var isOutOfScreen = ( nextOuterTop > ( $(window).scrollTop() + $(window).height() ) );

        $(nextSection).addClass('coverAfter' + this.id);

        this._isBottomClosing = true;

        nextSections.each(function (index) {
            if (isOutOfScreen) {
                $(this).css("transform", "translate3d(0px, " + deltaStartPos + "px,0px)");
            }

            // redraw hack to correct animations. Need to be on each section
            var redraw = this.offsetHeight;

            $(this).addClass("sectionAnimation");
            //$(this).css("transition-duration", "1s");

            $(this).css("transform", "translate3d(0px, " + deltaFinishPos + "px,0px)");

            $(this).one(utils.transitionEndGeneral(), function (e) {
                $(this).removeClass("sectionAnimation");
                $(this).css("transform", '');
                $(this).css("transition-duration", "");
            })
        })

        var _self = this;
        nextSection.one(utils.transitionEndGeneral(), function (e) {

            $(nextSection).removeClass('coverAfter' + _self.id);

            _self._isBottomClosing = false;
            if (!_self._isTopClosing && !_self._isBottomClosing) _self._onSectionsClosed();
        })

    }

    $.fn.iSlider = function (options) {
        return this.each(function () {
            new ISlider(this, options).init();
        });
    };
})(jQuery);