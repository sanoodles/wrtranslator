
/**
 * target application dependant functions.
 * common interface implemented for thunderbird.
 */
var wrtranslator_tarApp = {



  /**
   * @section private methods
   */
  /* 
      For Thunderbird, to open links in a remote browser 
      taken from
        https://addons.mozilla.org/en-US/thunderbird/addon/403
      further references: 
          http://gemal.dk/blog/2004/06/29/xul_how_do_i_open_an_url/ , 
          http://www.xulplanet.com/references/xpcomref/ifaces/nsIMessenger.html
    */
  launchExternalURL: function (url)
  {
      /* Remote browser */
      var messenger = Components.classes["@mozilla.org/messenger;1"].createInstance();
      messenger = messenger.QueryInterface(Components.interfaces.nsIMessenger);
      messenger.launchExternalURL(url);
  },



  /**
   * @section public interface
   */
    
  // floating link vertical offset
  FLvoffset: 80, // for thunderbird 3
  // FLvoffset: 60, // for thunderbird 2
  
  OpenURL: function (url)
  {
    this.launchExternalURL(url);
  },

  // returns thunderbird context menu
  getContextMenu: function()
  {
    // https://developer.mozilla.org/En/XUL/PopupGuide/Extensions#Showing_and_hiding_context_menu_items
    var contextMenu = document.getElementById("mailContext");
        // works if in main window

    if (contextMenu == null) {
      contextMenu = document.getElementById("msgComposeContext");
        // works if in compose window
    }
    
    return contextMenu;
  }
  
  
}
/* remember: every symbol but the last one needs to have a comma at the end */
