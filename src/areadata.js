/* areadata.js
   AreaData and MapArea protoypes
*/

(function ($) {
    var p, m = $.mapster, u = m.utils;
    m.AreaData = function (owner, key, value) {
        this.owner = owner;
        this.key = key || '';
        this.areaId = -1;
        this.value = value || '';
        this.options = {};
        this.selected = null;   // "null" means unchanged. Use "isSelected" method to just test true/false
        this.areas = [];        // MapArea objects
        this.area = null;       // (temporary storage) - the actual area moused over
        this._effectiveOptions = null;
    };
    p = m.AreaData.prototype;
    // return all coordinates for all areas
    p.coords = function (percent, offset) {
        var coords = [];
        $.each(this.areas, function (i, el) {
            coords = coords.concat(el.coords(percent, offset));
        });
        return coords;
    };
    p.reset = function (preserveState) {
        $.each(this.areas, function (i, e) {
            e.reset(preserveState);
        });
        this.areas = null;
        this.options = null;
        this._effectiveOptions = null;
    };
    // Return the effective selected state of an area, incorporating staticState
    p.isSelectedOrStatic = function () {
        var o = this.effectiveOptions();
        return u.isBool(this.selected) ? this.selected :
                    (u.isBool(o.staticState) ? o.staticState :
                    (u.isBool(this.owner.options.staticState) ? this.owner.options.staticState : false));
    };
    p.isSelected = function () {
        return this.selected || false;
    };
    p.isSelectable = function () {
        return u.isBool(this.effectiveOptions().staticState) ? false :
                    (u.isBool(this.owner.options.staticState) ? false : this.effectiveOptions().isSelectable);
    };
    p.isDeselectable = function () {
        return u.isBool(this.effectiveOptions().staticState) ? false :
                    (u.isBool(this.owner.options.staticState) ? false : this.effectiveOptions().isDeselectable);
    };
    //    p.setTemporaryOption = function (options) {
    //        this.tempOptions = options;
    //    };
    p.effectiveOptions = function (override_options) {
        //if (!this._effectiveOptions) {
        //TODO this isSelectable should cascade already this seems redundant
        var opts = u.updateProps({},
                this.owner.area_options,
                this.options,
                override_options || {},
            //this.tempOptions || {},
                {id: this.areaId }
            );

        return opts;
        //}
        //return this._effectiveOptions;
    };
    p.effectiveRenderOptions = function (type, override_options) {
        var allOpts = this.effectiveOptions(override_options),
            opts = u.updateProps({},
            allOpts,
            allOpts["render_" + type],
            { alt_image: this.owner.altImage(type) });
        return opts;
    };
    // Fire callback on area state change
    p.changeState = function (state_type, state) {
        if ($.isFunction(this.owner.options.onStateChange)) {
            this.owner.options.onStateChange.call(this.owner.image,
                    {
                        key: this.key,
                        state: state_type,
                        selected: state
                    });
        }
    };
    // highlight this area, no render causes it to happen internally only
    p.highlight = function (noRender) {
        var o = this.owner;
        if (!noRender) {
            o.graphics.addShapeGroup(this, "highlight");
        }
        o.setHighlightID(this.areaId);
        this.changeState('highlight', true);
    };
    // select this area. if "callEvent" is true then the state change event will be called. (This method can be used
    // during config operations, in which case no event is indicated)
    p.drawSelection = function () {
        this.owner.graphics.addShapeGroup(this, "select");
    };
    p.addSelection = function () {
        // need to add the new one first so that the double-opacity effect leaves the current one highlighted for singleSelect
        var o = this.owner;
        if (o.options.singleSelect) {
            o.clearSelections();
        }

        // because areas can overlap - we can't depend on the selection state to tell us anything about the inner areas.
        // don't check if it's already selected
        //if (!this.isSelected()) {
        this.drawSelection();
        this.selected = true;
        this.changeState('select', true);
        //}

        if (o.options.singleSelect) {
            o.graphics.refreshSelections();
        }
    };
    // Remve a selected area group. If the parameter "partial" is true, then this is a manual operation
    // and the caller mus call "finishRemoveSelection" after multiple "removeSelectionFinish" events
    p.removeSelection = function (partial) {

        //            if (this.selected === false) {
        //                return;
        //            }
        this.selected = false;
        this.changeState('select', false);
        this.owner.graphics.removeSelections(this.areaId);
        if (!partial) {
            this.owner.removeSelectionFinish();
        }
    };
    // Complete selection removal process. This is separated because it's very inefficient to perform the whole
    // process for multiple removals, as the canvas must be totally redrawn at the end of the process.ar.remove

    p.toggleSelection = function (partial) {
        if (!this.isSelected()) {
            this.addSelection();
        }
        else {
            this.removeSelection(partial);
        }
        return this.isSelected();
    };


    // represents an HTML area
    m.MapArea = function (owner, areaEl) {
        if (!owner) {
            return;
        }
        var me = this;
        me.owner = owner;   // a MapData object
        me.area = areaEl;
        me.originalCoords = [];
        $.each(u.split(areaEl.coords), function (i, el) {
            me.originalCoords.push(parseFloat(el));
        });
        me.length = me.originalCoords.length;
        me.shape = areaEl.shape.toLowerCase();
        me.nohref = areaEl.nohref || !areaEl.href;

    };
    m.MapArea.prototype.coords = function () {
        return this.originalCoords;
    };

} (jQuery));