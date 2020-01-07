// ## HTML
// it all begins with HTML somewhere out there we want a canvas to draw on, 
// we could create one, but for the purposes of this document it will be easier
// for us to ask the host HTML file to provide us a canvas element named `"c"`
function getHtmlCanvas() {
    const canvas = window.document.getElementById('c');
    // to keep things simple we're working in the global browser space, and we'll note
    // that with a `g_` prefix
    // let's make sure our host HTML document provided us a canvas
    // and in the spirit of readable error messages we'll use a [utility function](utility.html#throwIfFalsey "Utility Functions for Literate Ray Tracer")
    throwIfFalsey(canvas, 'requires an HTML canvas element with the id "c"');
    // we'll want to [resize](#resize, "Resize documentation")
    // to make sure our canvas is using all of the space it can
    resize(canvas);
    return canvas;
}
//
// <a name="resize"></a>
// ### Handling Resizes
//
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
function createElement(type) {
    const el = window.document.createElement(type);
    throwIfFalsey(el, 'could not create ' + type + ' html element');
    return el;
}
// numeric input will be used in several places
function createNumericInput(init, onChange) {
    const input = createElement('input');
    input.type = 'number';
    input.value = init + '';
    const onUpdate = (e) => {
        const n = parseInt(e.target.value, 10);
        onChange(n);
    };
    input.addEventListener('change', onUpdate);
    input.addEventListener('blur', onUpdate);
    return {
        element: input,
        free: () => {
            input.removeEventListener('change', onUpdate);
            input.removeEventListener('blur', onUpdate);
        },
    };
}
// buttons are a useful control to have
function createButton(label, onClick) {
    const element = createElement('button');
    element.innerHTML = label;
    const on = () => onClick();
    element.addEventListener('click', on);
    return {
        element,
        free: () => element.removeEventListener('click', on),
    };
}
// we'll want to be able to toggle things
function createToggleButton(labelA, labelB, onToggle) {
    // let's make a toggle button
    const element = createElement('button');
    // we'll use `labelA` as the first state
    let label = labelA;
    element.innerHTML = label;
    // and we'll want to manage the label and report clicks
    const onClick = () => {
        // swap the labels
        if (label === labelA) {
            label = labelB;
        }
        else {
            label = labelA;
        }
        element.innerHTML = label;
        // inform the consumer
        onToggle();
    };
    // attach the handler
    element.addEventListener('click', onClick);
    // return the element so it can be mounted
    // also provide a mechanism to release the event listener
    return {
        element,
        free: () => element.removeEventListener('click', onClick),
    };
}
// drop downs are one way to let people select between a few choices
function createDropDown(list, selected, onSelect) {
    const select = createElement('select');
    list.map((label, i) => {
        const option = createElement('option');
        if (i === selected) {
            option.selected = true;
        }
        option.value = i + '';
        option.innerHTML = label;
        select.appendChild(option);
        return option;
    });
    const onChange = (e) => {
        onSelect(parseInt(e.target.value, 10));
    };
    select.addEventListener('change', onChange);
    select.addEventListener('blur', onChange);
    return {
        element: select,
        free: () => {
            select.removeEventListener('change', onChange);
            select.removeEventListener('blour', onChange);
        },
    };
}
// and we'll provide a way to bind the optional input controls
function bindInputControls(state) {
    const inputArea = window.document.getElementById('i');
    if (!inputArea) {
        return;
    }
    const controls = [
        createToggleButton('pause', 'resume', () => {
            if (state.isAnimating) {
                state.isAnimating = false;
            }
            else {
                state.isAnimating = true;
                animate(0);
            }
        }),
        createDropDown(['PBR', 'Blinn Phong'], 0, (index) => {
            if (index === 1) {
                state.shadingModel = 1;
            }
            else {
                state.shadingModel = 0;
            }
        }),
        createDropDown(['0x AA', '2x AA', '4x AA'], 0, (index) => {
            if (index === 4) {
                state.aa = 4;
            }
            else if (index === 2) {
                state.aa = 2;
            }
            else {
                state.aa = 0;
            }
        }),
    ];
    controls.forEach(control => {
        inputArea.appendChild(control.element);
    });
    return () => {
        controls.forEach((control) => control.free());
    };
}
