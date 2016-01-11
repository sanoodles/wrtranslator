// https://addons.mozilla.org/en-US/developers



/*
 * https://developer.mozilla.org/en/Code_snippets/Preferences#Using_preference_observers
 */
var wrtranslatorPrefObserver = {
    register: function () {
        var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                                    .getService(Components.interfaces.nsIPrefService);
        this._branch = prefService.getBranch("extensions.wrtranslator.");
        this._branch.QueryInterface(Components.interfaces.nsIPrefBranch);
        this._branch.addObserver("", this, false);
    },
    unregister: function () {
        if(!this._branch) return;
        this._branch.removeObserver("", this);
    },
    observe: function (aSubject, aTopic, aPrefName) {
        if(aTopic != "nsPref:changed") return;
        wrtranslator.loadPrefs();
    }
}



/**
 * Index of sections:
 * - Preferences
 * - URI to visit
 * - Selected text
 * - Context menu
 * - Floating link
 * - Status bar
 * - Main event
 * - Initialization
 */
var wrtranslator = {





    // To remember the state of the floating link
    fl: null,       // floating link DOM element
    fl_body: null,  // DOM body that contains fl

    /* For js strings localization
     *  from https://addons.mozilla.org/es-ES/firefox/addon/5203
     *      http://babelwiki.babelzilla.org/index.php?title=Tutorials#How_to_localize_strings_included_in_a_.js_file
     */
	  wrstrings: Components.classes["@mozilla.org/intl/stringbundle;1"]
            .getService(Components.interfaces.nsIStringBundleService)
            .createBundle("chrome://wrtranslator/locale/strings.properties"),

    /* For timer
     *  https://developer.mozilla.org/en/nsITimer
     *      http://forums.mozillazine.org/viewtopic.php?f=19&t=795145
     */
    timer: Components.classes["@mozilla.org/timer;1"]
            .createInstance(Components.interfaces.nsITimer),





    /**
     *
     * @section Preferences
     *
     */





    /**
     * @return the nsIPrefBranch of wrtranslator
     *    http://www.xulplanet.com/references/xpcomref/ifaces/nsIPrefService.html
     */
    getPrefs: function ()
    {
        var res;
        res = Components.classes["@mozilla.org/preferences-service;1"]
               .getService(Components.interfaces.nsIPrefService)
               .getBranch("extensions.wrtranslator.");
        return res;
    },

    /**
     * @return get floating link enable
     */
    getFLenable: function ()
    {
        return this.getPrefs().getBoolPref("floating_link_enable");
    },

    /**
     * set floating link enable
     */
    setFLenable: function (value)
    {
        return this.getPrefs().setBoolPref("floating_link_enable", value);
    },

    /**
     * @return get floating link time
     */
    getFLtime: function ()
    {
        return this.getPrefs().getIntPref("floating_link_time");
    },

    /**
     * @return get the default translation language
     *  http://developer.mozilla.org/en/docs/Adding_preferences_to_an_extension
     *  http://www.xulplanet.com/references/xpcomref/ifaces/nsIPrefService.html
     */
    getLang: function ()
    {
        return this.getPrefs().getCharPref("language").toString();
    },

    getStatusVisible: function ()
    {
        return this.getPrefs().getBoolPref("status_visible");
    },

    loadPrefs: function () {

        // status bar icon
        if (this.getStatusVisible()) {
            document.getElementById("wrtranslator-status").style.display = "";
        } else {
            document.getElementById("wrtranslator-status").style.display = "none";
        }

    },




    
    /**
     *
     * @section URI to visit
     * 
     */

     /*
      * returns the associated wordreference url span for _lang
      *   created to avoid using an associative array
      *     http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array#Description
      */
    lang2urlspan: function (_lang)
    {
        var res = "";
        var i = 0;

        while (_lang != (wrtranslator_lang1_list[i] + "-" + wrtranslator_lang2_list[i])) {
            i++;
        }
        res = wrtranslator_urlspans_list[i];

        return res;
    },

    getTranslationUri: function (text, _lang)
    {
        var urlspan = "";
        
        if (_lang == "") {
            urlspan = this.lang2urlspan(this.getLang());
        } else {
            urlspan = this.lang2urlspan(_lang);
        }

        var uri = "http://www.wordreference.com/" +
                urlspan +
                text +
                "#articleHead";
          
        return uri;
    },

  



    /**
     *
     * @section Selected text
     *
     */

    thereIsSelectedText: function ()
    {
        var res;

        // if there is a lot of text selected, this can delay the opening of the context menu
        // a selectionStart != selectionEnd approach would be (I think) more efficient
        res = document.commandDispatcher.focusedWindow.getSelection().toString() != "";
        if (res) return true;

        // visible if there is selected text on a firefox textbox
        var elem = document.commandDispatcher.focusedElement;
        return (elem != null) && (elem.selectionStart != elem.selectionEnd);
    },

    elemIsPassword: function (elem)
    {
        if (!elem.hasAttribute("type")) return false;

        return elem.getAttribute("type") == "password";
    },

    /**
     * @return Text selected in the page, whether it is in text form controls or not.
     *    "" if there is no selected text.
     */
    getSelectedText: function ()
    {
        // https://developer.mozilla.org/en/XUL_Tutorial/Focus_and_Selection
        
        var text = "";

        // first attempt: try on page / thunderbird
        text = document.commandDispatcher.focusedWindow.getSelection().toString();
        if (text != "") return text;
            
        // second attempt: try on currently focused firefox/thunderbird text box, if any
            // http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:String#Methods
        var elem = document.commandDispatcher.focusedElement;
        if ((elem != null) && !this.elemIsPassword(elem)) {
        
            var start = elem.selectionStart;
            var end = elem.selectionEnd;
            // http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:String:substring
            // text = elem.value.toString().substring(start, end);
            
            if (start != end) {
                var ftext = elem.value.toString(); // full text
                text = ftext.substring(start, end);
            }
        }

        return text;
    },





    /**
     *
     * @section Context menu
     *
     */

    /*
     * populate the "Translate as ..." submenu
     *  browser.js::PHM_populateUndoSubmenu 
     */
    populateLangsSubmenu: function (event)
    {
        var langPopup = document.getElementById("wrtranslator-popup-translateas");
        
        var lang1 = "";
        var lang2 = "";
        var lang = "";
        var m = null;

        for (var i = 0, max = wrtranslator_lang1_list.length; i < max; i++) {
            lang1 = wrtranslator_lang1_list[i];
            lang2 = wrtranslator_lang2_list[i];
            lang = lang1 + "-" + lang2;

            if (lang1 != "") {

                // print "language 1 to language 2"
                m = langPopup.appendChild(document.createElement("menuitem"));
                m.setAttribute("label", lang);
                m.setAttribute("value", lang);

                // https://developer.mozilla.org/en/XUL/Events

                /*
                 * Unsecure technique used until 1.6.5
                 */
                // m.setAttribute("oncommand", "wrtranslator.onMenuItemCommand(event, '" + lang + "');");
                
                m.addEventListener(
                    "command",

                    // @see JavaScript The Good Parts 4.10 Closure
                    function (lg) {

                        // function with its own context (a different
                        // value for "lg" each time)
                        return function (e) {
                            wrtranslator.onMenuItemCommand(e, lg);
                        }
                    }(lang),
                    false
                );
                
            } else { 

                // print separator
                langPopup.appendChild(document.createElement("menuseparator"));

            // fi
            }

        // ffor
        } 

    },

    /*
     * shows and hides the Context menu items when appropiate
     */
    ContextShowHideItems: function (event)
    {
        var visible = this.thereIsSelectedText();

        // "Translate"
        var elem = document.getElementById("wrtranslator-context-translate");
        elem.hidden = !visible;

        // "Translate as..."
        elem = document.getElementById("wrtranslator-context-translateas");
        elem.hidden = !visible;
    },





    /**
     *
     * @section Floating link
     *
     */
  
    /*
     * Hide floating link 
     */
    hideFL: function ()
    {
        if (this.fl_body != null && this.fl != null) {
            try {
              this.fl_body.removeChild(this.fl);
            } 
            catch (ex) {
              console.log("Exception on wrtranslator.hideFL, trying this.fl_body.removeChild(this.fl)");
            }
            this.fl_body = null;
            this.fl = null;
        }
    },

    /*
     * Sets the position of the floating link
     */
    setFLpos: function (div, event) {       
        div.style.left = event.clientX - 48 + "px";
        if ((event.clientY - wrtranslator_tarApp.FLvoffset) > 0) { // if it fits above the click
          div.style.top = (event.clientY - wrtranslator_tarApp.FLvoffset) + "px";
        } else {
          div.style.top = (event.clientY + 16) + "px";
        }
    },
    
    /*
     * Shows the floating link
     */
    onDblClick: function (event)
    {
        // floating content addtion from https://addons.mozilla.org/en-US/firefox/addon/10839

        if (this.getFLenable()) {

            var selectedText = this.getSelectedText();
            
            if (selectedText != "") {
            
                // delete previous link, if it was not yet hided by timer
                if (this.fl != null) {
                    this.timer.cancel(); // cancel ongoing timer count down.
                    this.hideFL();
                }
                
                // double click was with in a HTML document
                if (event.target.ownerDocument.body != null) {
                    
                    // save a reference to the body the floating link is in (could be N tabs)
                    this.fl_body = event.target.ownerDocument.body;
                    
                    // set the container div and set a reference to it
                    var div = event.target.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml", "div");
                    div.id = "wrtranslator-translate";
                    this.setFLpos(div, event);
                    this.fl = div;
                    
                    // set the link
                    var link = event.target.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml", "a");
                    link.href = this.getTranslationUri(selectedText, "");
                    link.target = "_blank";
                    var linkText = this.wrstrings.GetStringFromName("translateString");
                    link.textContent = linkText;
                    
                    // add link to div
                    this.fl.appendChild(link);
                    
                    // add div to body
                    this.fl_body.appendChild(this.fl);
                    
                    // start count down for link hiding
                    this.timer.initWithCallback(
                       {notify: function (timer) { wrtranslator.hideFL(); }},
                       this.getFLtime(),
                       Components.interfaces.nsITimer.TYPE_ONE_SHOT);

                // double click was in the browser chrome
                } else {
                
                    // nothing. is not a feature.
                
                // fi double click place
                }

            // fi selectedText
            }
         
        // fi getFLenable   
        }
    },


    
  

    /**
     *
     * @section Status bar
     *
     */

	statusClick: function (event) {

        // left click
        if (event.button == 0) {

            var panel = document.getElementById("wrtranslator-status");
            
            // fl_enable
            if (this.getFLenable()) {

                panel.style.fontWeight = "normal";
                this.setFLenable(false);

            // no fl_enable
            } else {

                panel.style.fontWeight = "bold";
                this.setFLenable(true);

            // fi fl_enable
            }
        }
	},





    /**
     * @section Main event
     *  if there is a word selected anywhere in the current tab, shows it in wordreference
     */
    onMenuItemCommand: function (event, _lang)
    {
        /*
            pre:
              _lang: string. a value within en-es, es-en, en-fr, fr-en, ...
            post:
              opens a new tab with the selected text translated in wordreference,
              as it had been set in options, or as specified by _lang
        */

        var text = this.getSelectedText();
        
        if (text != "") { 
            var uri = this.getTranslationUri(text, _lang);
            wrtranslator_tarApp.OpenURL(uri);
        }

    },





    /**
     *
     * @section Initialization
     *
     */
    
    /*
     * make CSS available
     */
    loadCSS: function ()
    {
        // https://developer.mozilla.org/en/Using_the_Stylesheet_Service

        var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
                .getService(Components.interfaces.nsIStyleSheetService);
        var ios = Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);
        var uri = ios.newURI("chrome://wrtranslator/content/css.css", null, null);
        sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
    },
  
    onLoad: function ()
    {

        // load css
        this.loadCSS();

        // if it's the first execution, popup the options window
        var firstexec = this.getPrefs().getBoolPref("firstexec");
        if (firstexec) {
            window.open("chrome://wrtranslator/content/options.xul", "", "chrome,centerscreen");
            this.getPrefs().setBoolPref("firstexec", false);
        }

        // populate the "Translate as ..." context submenu
        this.populateLangsSubmenu();

        // set statusbar
        if (this.getFLenable()) {
            document.getElementById("wrtranslator-status").style.fontWeight = "bold";
        }

        // listen context menu event
            // http://developer.mozilla.org/en/docs/XUL:PopupGuide:Extensions#Showing_and_Hiding_Context_Menu_Items
        var contextMenu = wrtranslator_tarApp.getContextMenu();
        if (contextMenu)
            contextMenu.addEventListener("popupshowing",
                    function (e) { wrtranslator.ContextShowHideItems(e); },
                    false);
          
        // listen double click event
        document.addEventListener("dblclick", 
               function (e) { wrtranslator.onDblClick(e); },
               false);

        // prefwindow-time consulted preferences
        this.loadPrefs();
        wrtranslatorPrefObserver.register();

    },


    onUnload: function ()
    {
        // unload event listeners

        // unload observers
        wrtranslatorPrefObserver.unregister();
    }

    

};

// https://developer.mozilla.org/en/DOM/element.addEventListener#Memory_issues
window.addEventListener("load", function (e) { wrtranslator.onLoad(e); }, false);
window.addEventListener("unload", function (e) { wrtranslator.onUnload(e); }, false);

