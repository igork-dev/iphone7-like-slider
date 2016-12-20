require("./stick");
require("./LockScroll");
var utils = require("./utils")

;(function ($) {

    var ISlider = function (elem, options) {

        this.hiddenSection = $(elem);
        this.openButton = $(options.button);

        this.sections = "header, footer, section, article, p, blockquote, div";
    };

    ISlider.prototype.init = function(){

        var prevAllWithParents = this.GetPrevAllWithParents();
        var nextAllWithParents = this.GetNextAllWithParents();
        var prevSection = prevAllWithParents.first();
        var nextSection = nextAllWithParents.first();

        // Remove gaps around hidden section, it's necessary
        prevSection.css("marginBottom", 0);
        nextSection.css("marginTop", 0);

        // Remove gaps in hidden section, it's necessary
        this.hiddenSection.css("marginTop", 0);
        this.hiddenSection.css("marginBottom", 0);
        this.hiddenSection.css("paddingTop", 0);
        this.hiddenSection.css("paddingBottom", 0);
        this.hiddenSection.css("overflow", "hidden");

        // Closing hiddenSection
        this.hiddenSection.addClass("collapsed");

        // Need to be after overflow:hidden
        var hiddenSectionHeight = this.hiddenSection.prop('scrollHeight');

        // Cover gaps which produced by paddings and margins
        var coverAfterTranslateY = parseInt(nextSection.css("paddingTop"));
        var coverBeforeTranslateY = -hiddenSectionHeight - parseInt(prevSection.css("paddingBottom"));

        $('<style>' +
            '.coverBefore:before{' +
            'content:"";' +
            'height: ' + hiddenSectionHeight  + 'px;' +
            'background-color: white;' +
            'display: block;' +
            'position: absolute;' +
            'width: 100%;' +
            'transform: translate3d(0, ' + coverBeforeTranslateY + 'px, 0); ' +
            '}' +
            '.coverAfter:after{' +
            'content:"";' +
            'height: ' + hiddenSectionHeight  + 'px;' +
            'background-color: white;' +
            'position: absolute;' +
            'display: block;' +
            'width: 100%;' +
            'transform: translate3d(0, ' + coverAfterTranslateY + 'px, 0); ' +
            '}' +
            '</style>').appendTo('head');

        // We cannot cover the next section, so we made this manually
        if( nextSection.css("background-color") == "rgba(0, 0, 0, 0)" && nextSection.css("background-image") == "none" ) {
            nextSection.css("background-color", "white");
        }

        this.hiddenSection.prepend("<div class='isliderCloseButtonWrapper'><img src='img/plus.png' class='isliderCloseButton'></div>");

        this.closeButton = $(".isliderCloseButton");
        this.closeButtonWrapper = $(".isliderCloseButtonWrapper");

        // Stick button to the top of the screen when user move through hidden section
        this.stick = new window.Stick({
            element: this.closeButtonWrapper
            , parentElement: this.hiddenSection
            , marginInSection: 50
            , marginFixed: 20
        });
        this.closeButton.css("display", "none");
        this.openButton.addClass("isliderOpenButton");
        this.LockScroll = new window.LockScroll();

        var _self = this;
        this.openButton.on("click", function(e) {
            e.preventDefault();
            _self.OpenRow();
        });

        this.closeButton.on("click", function(e) {
            e.preventDefault();
            _self.CloseRow();
        });
    };

    ISlider.prototype.OpenRow = function() {

        // if animation in process - return
        if( this.LockScroll.isLocked ) return;

        this.stick.enableListener();

        this.openButton.fadeTo( 400, 0, function() {$(this).css("visibility", "hidden")});
        this.closeButton.css("visibility", "visible").delay(1000).fadeTo(400, 0.4);

        this.PushNextAll();
    }

    ISlider.prototype.CloseRow = function() {

        if( this.LockScroll.isLocked ) return;

        this.closeButton.fadeTo( 400, 0, function() {$(this).css("visibility", "hidden")});
        this.openButton.css("visibility", "visible").delay(1000).fadeTo(400, 1);

        var hiddenBoxTop = this.hiddenSection.offset().top;
        var hiddenBoxBottom = this.hiddenSection.offset().top + this.hiddenSection.height();
        var screenTop = $(window).scrollTop();
        var screenBottom = $(window).scrollTop() + $(window).height();


        var targetPosition;

        // If we can see top of hiddenSection and can't see bottom, than move bottom section to top
        if( hiddenBoxTop > screenTop && hiddenBoxTop < screenBottom ) {
            targetPosition = hiddenBoxTop;

        // If we can see bottom of hiddenSection and can't see top, than move top section to bottom
        } else if(hiddenBoxBottom < screenBottom) {
            targetPosition = hiddenBoxBottom;

        // If top and bottom of hidden section is out of screen, than move top and bottom sections to 2/3 of screen.
        } else {
            targetPosition = screenTop + $(window).height() * 0.7; /* Это только для среднего */
        }
        // If we can see whole hidden section, than move bottom section to top

        // If there is no place to scrolling below, than move line of contact
        var targetBottomHeight = ($(window).scrollTop() + $(window).height()) - targetPosition;
        var nextSectionsHeight = $(document).height() - (this.hiddenSection.offset().top + this.hiddenSection.height());

        if( nextSectionsHeight < targetBottomHeight ) {
            targetPosition += (targetBottomHeight - nextSectionsHeight);
        }

        // If there is no place to scrolling above, than move line of contact
        var prevSectionsHeight = this.hiddenSection.offset().top;
        var targetTopHeight = targetPosition - $(window).scrollTop();

        if(prevSectionsHeight < targetTopHeight) {
            targetPosition -= (targetTopHeight - prevSectionsHeight);
        }

        this.PullPrevAll( targetPosition );
        this.PullNextAll( targetPosition );
    }

    ISlider.prototype.GetPrevAllWithParents = function () {

        var currentElement = $(this.hiddenSection);
        var elements = $();

        for(var i = 0; i < 50; i ++) // infinity loop
        {
            $.merge(elements, currentElement.prevAll( this.sections )); // specific elements above current
            currentElement = $(currentElement).parent(); // any type of parent, not specific
            if( currentElement.length == 0 ) { break; }
        }

        return elements;
    }

    ISlider.prototype.GetNextAllWithParents = function () {

        var currentElement = $(this.hiddenSection);
        var elements = $();

        for(var i = 0; i < 50; i ++) // infinity loop
        {
            $.merge(elements, currentElement.nextAll( this.sections ));
            currentElement = $(currentElement).parent();
            if( currentElement.length == 0 ) { break; }
        }

        return elements;
    }

    ISlider.prototype.PushNextAll = function () {

        this.LockScroll.enable();

        var nextSections = this.GetNextAllWithParents();
        var nextSection = nextSections.first();

        // To protect from errors
        if( nextSection.length == 0 ) return;

        this.hiddenSection.removeClass("collapsed");

        // Initial position of sections
        var deltaStartPos = -this.hiddenSection.prop('scrollHeight');

        var bottomScreen = $(window).scrollTop() + $(window).height();

        var deltaFinishPos;
        // If next sections position is out of the screen ( position counted without transform )
        if( nextSection.offset().top > bottomScreen ) {
            // Than move section with animation to screen bottom and than instantly go to own position
            deltaFinishPos = deltaStartPos + (bottomScreen - this.hiddenSection.offset().top);
        } else {
            // Else sections position position is on the screen and we move with animation to it
            deltaFinishPos = 0;
        }

        // Cover margin/padding gaps
        $(nextSection).addClass('coverAfter');

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
        nextSection.one( utils.transitionEndGeneral(), function(e) {
            $(nextSection).removeClass('coverAfter');
            _self.LockScroll.disable();
        })
    }

    /**
     * Move all top sections to target position
     * @param {Number} targetPosition - position where top and bottom sections connects
     */
    ISlider.prototype.PullPrevAll = function ( targetPosition ) {

        this.LockScroll.enable();

        var prevSections = this.GetPrevAllWithParents();
        var prevSection = prevSections.first();

        // To protect from errors
        if( prevSection.length == 0 ) return;

        var currentPrevBottom = prevSection.offset().top + prevSection.outerHeight();

        // If sections is already on place - we don't need to move them
        if( targetPosition == currentPrevBottom ) return;

        var deltaStartPos = $(window).scrollTop() - currentPrevBottom;
        var deltaFinishPos = targetPosition - currentPrevBottom;

        var isOutOfScreen = ( prevSection.offset().top + prevSection.height()) < $(window).scrollTop();

        // Cover gaps from margins and paddings. Class described in init func
        $(prevSection).addClass('coverBefore');

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

                $(this).css("transform", "translate3d(0px, " + deltaFinishPos + "px,0px)");

                $(this).one(utils.transitionEndGeneral(), function (e) {
                    $(this).removeClass("sectionAnimation");
                    $(this).css("transform", '');
                    if (!$(this).is(prevSection)) {
                        $(this).css("z-index", '');
                    }
                    $(this).css("position", "");
                })

            }
        })

        var _self = this;
        prevSection.one( utils.transitionEndGeneral(), function(e) {

            $(window).scrollTop( $(window).scrollTop() - deltaFinishPos );
            _self.hiddenSection.addClass("collapsed");
            $(prevSection).removeClass('coverBefore');

            $(".islider-z-changed").each( function(e) {
                $(this).removeClass("islider-z-changed");
                $(this).css("z-index", 'auto');
            })

            _self.LockScroll.disable();
            _self.stick.disableListener();
        })
    }

    /**
     * Move all bottom sections to target position
     * @param {Number} targetPosition - position where top and bottom sections connects
     */
    ISlider.prototype.PullNextAll = function( targetPosition ) {

        this.LockScroll.enable();

        var nextSections = this.GetNextAllWithParents();
        var nextSection = nextSections.first();

        // To protect from errors
        if( nextSection.length == 0 ) return;

        var nextOuterTop = nextSection.offset().top;

        if( targetPosition == nextOuterTop ) return;

        var deltaStartPos = ($(window).scrollTop() + $(window).height()) - nextOuterTop;
        var deltaFinishPos = targetPosition - nextOuterTop;

        var isOutOfScreen = ( nextOuterTop > ( $(window).scrollTop() + $(window).height() ) );

        $(nextSection).addClass('coverAfter');

        nextSections.each(function (index) {
            if (isOutOfScreen) {
                $(this).css("transform", "translate3d(0px, " + deltaStartPos + "px,0px)");
            }

            // redraw hack to correct animations. Need to be on each section
            var redraw = this.offsetHeight;

            $(this).addClass("sectionAnimation");

            $(this).css("transform", "translate3d(0px, " + deltaFinishPos + "px,0px)");

            $(this).one(utils.transitionEndGeneral(), function (e) {
                $(this).removeClass("sectionAnimation");
                $(this).css("transform", '');
            })
        })

        var _self = this;
        nextSection.one( utils.transitionEndGeneral(), function(e) {
            _self.hiddenSection.addClass("collapsed");
            $(nextSection).removeClass('coverAfter');
            _self.LockScroll.disable();
            _self.stick.disableListener();
        })

    }

    $.fn.iSlider = function (options) {
        return this.each(function () {
            new ISlider(this, options).init();
        });
    };
})(jQuery);