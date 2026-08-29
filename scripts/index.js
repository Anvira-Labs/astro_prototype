// Zodiac Bee prototype — launcher (screen + viewport switcher)
(function () {
  var screenTabs = document.getElementById("screenTabs");
  var viewportToggle = document.getElementById("viewportToggle");
  var stage = document.getElementById("stage");
  var fullscreenLink = document.getElementById("fullscreenLink");

  var screen = "home";
  var viewport = "mobile";

  function render() {
    var src = "screens/" + screen + ".html";
    fullscreenLink.setAttribute("href", src);

    if (viewport === "mobile") {
      stage.innerHTML =
        '<div class="device-frame">' +
        '  <div class="device-screen">' +
        '    <div class="notch"></div>' +
        '    <iframe title="' + screen + ' preview, mobile width" src="' + src + '"></iframe>' +
        "  </div>" +
        "</div>";
    } else {
      stage.innerHTML =
        '<div class="browser-frame">' +
        '  <div class="browser-chrome">' +
        '    <span class="browser-dots"><span></span><span></span><span></span></span>' +
        '    <span class="browser-url">zodiacbee.app/' + screen + "</span>" +
        "  </div>" +
        '  <iframe title="' + screen + ' preview, desktop width" src="' + src + '"></iframe>' +
        "</div>";
    }
  }

  screenTabs.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-screen]");
    if (!btn) return;
    Array.prototype.forEach.call(screenTabs.querySelectorAll("[data-screen]"), function (b) {
      b.setAttribute("aria-pressed", "false");
    });
    btn.setAttribute("aria-pressed", "true");
    screen = btn.getAttribute("data-screen");
    render();
  });

  viewportToggle.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-viewport]");
    if (!btn) return;
    Array.prototype.forEach.call(viewportToggle.querySelectorAll("[data-viewport]"), function (b) {
      b.setAttribute("aria-pressed", "false");
    });
    btn.setAttribute("aria-pressed", "true");
    viewport = btn.getAttribute("data-viewport");
    render();
  });

  render();
})();
