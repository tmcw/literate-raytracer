// ## HTML
// it all begins with HTML somewhere out there we want a canvas to draw on, 
// we could create one, but for the purposes of this document it will be easier
// for us to ask the host HTML file to provide us a canvas element named `"c"`
function bindToHTML() {
    const canvas = window.document.getElementById('c');
    // to keep things simple we're working in the global browser space, and we'll note
    // that with a `g_` prefix
    // let's make sure our host HTML document provided us a canvas
    // and in the spirit of readable error messages we'll use a [utility function](utility.html#throwIfFalsey "Utility Functions for Literate Ray Tracer")
    throwIfFalsey(canvas, 'requires an HTML canvas element with the id "c"');
    // we'll want to [resize](#resize, "Resize documentation")
    // to make sure our canvas is using all of the space it can
    resize(canvas);
    // ### Controlling The Animation
    // since we're still dealing with HTML let's get some references to the start/stop buttons
    const play = window.document.getElementById('play');
    const stop = window.document.getElementById('stop');
    // unlike with the canvas, let's not panic if these buttons are not present
    // we'll group our HTML bindings into an object for easier consumption
    return {
        canvas,
        play,
        stop,
    };
}
// ### Handling Resizes
// <a name="resize"></a>
// when working with a canvas we might want to be able to respond to resizes
// of the browser window.  Let' handle that case
function resize(canvas) {
    // We'll lookup the size the browser is displaying the canvas.
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    // Then we'll check if the canvas is not the same size.
    if (canvas.width != displayWidth || canvas.height != displayHeight) {
        // If we have to, we'll make the canvas the same size
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        // Let's give ourselves a signal that we _did_ resize
        return true;
    }
    // In the case we did _not_ resize we should also alert our invoker
    return false;
}
