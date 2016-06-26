
/**
 * target application dependant functions.
 * common interface implemented for firefox.
 */
var wrtranslator_tarApp = {



  /**
   * @section public interface
   */
  
  // floating link vertical offset
  FLvoffset: 80,
  
  OpenURL: function (url)
  {
    gBrowser.selectedTab = gBrowser.addTab(url, { relatedToCurrent: true });
  },
  
  // returns firefox context menu
  getContextMenu: function()
  {
    // http://developer.mozilla.org/en/docs/XUL:PopupGuide:Extensions#Showing_and_Hiding_Context_Menu_Items
    return document.getElementById("contentAreaContextMenu");
  }
  
}
/* remember: every symbol but the last one needs to have a comma at the end */
