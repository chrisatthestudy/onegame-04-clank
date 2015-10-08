/*
 * -----------------------------------------------------------------------------
 * Cursor
 * -----------------------------------------------------------------------------
 */
var Cursor = function(options, game) {
    'use strict';
    // Call the inherited constructor.
    this.constructor(options);
    // Keep a reference to the main game context object.
    this.game = game;
    this.setImage("graphics/cursor_01.png");
    // Default the cell offsets to 0
    this.left_cell = 0;
    this.top_cell = 0;
    // The currently-highlighted cell
    this.cell_x = 0;
    this.cell_y = 0;
};
// Constructor, to enable inheritance.
Cursor.prototype = (function() {
    'use strict';
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = jaws.Sprite.prototype;
    inherited.prototype.parent = jaws.Sprite.prototype;
    return new inherited;
})();
// Calculate the actual cell, based on the offset (this is for use with the
// viewport).
Cursor.prototype.offset_cell = function() {
    'use strict';
    this.cell_x = this.mouse_cell_x + this.left_cell;
    this.cell_y = this.mouse_cell_y + this.top_cell;
};
// Update the cursor display -- move the cursor to the mouse position, 
// constraining it to the tile cells.
Cursor.prototype.update = function() {
    'use strict';
    //jaws.log(Math.floor((jaws.mouse_y-40)/40));
    this.mouse_cell_x = Math.floor((jaws.mouse_x) / this.game.cell_size);
    this.mouse_cell_y = Math.floor((jaws.mouse_y) / this.game.cell_size);
    this.x = this.mouse_cell_x * this.game.cell_size;
    this.y = this.mouse_cell_y * this.game.cell_size;
    this.offset_cell();
//    jaws.log(this.cell_x + " : " + this.cell_y);
};

/*
 * -----------------------------------------------------------------------------
 * Sky - the scrolling sky background
 * -----------------------------------------------------------------------------
 */
function Sky() {
    'use strict';
    this.setup = function() {
        this.parallax = new jaws.Parallax({repeat_x: true});
        this.parallax.addLayer({image: "graphics/starry_sky_01.png", damping: 100});
        this.parallax.addLayer({image: "graphics/clouds_01.png", damping: 30});
        this.parallax.addLayer({image: "graphics/clouds_02.png", damping: 10});
        this.parallax.draw();
    };
    this.update = function() {
        this.parallax.camera_x += 1;    // scroll layers horizontally
    };
    this.draw = function() {
        this.parallax.draw();
    };
}

/*
 * -----------------------------------------------------------------------------
 * Tile - handles a single tile. Inherits from jaws.Sprite.
 * -----------------------------------------------------------------------------
 */
var Tile = function(options, game) {
    'use strict';
    // Call the inherited constructor.
    this.constructor(options);
    // Keep a reference to the main game context object.
    this.game = game;
    // Set the tile type
    this.type = options.type || 0;
    // Keep a note of the image filename
    this.imagefile = options.image;
};
// Constructor, to enable inheritance.
Tile.prototype = (function() {
    'use strict';
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = jaws.Sprite.prototype;
    inherited.prototype.parent = jaws.Sprite.prototype;
    return new inherited;
})();
 
/*
 * -----------------------------------------------------------------------------
 * Tiles - handles the tiles that make up a single 'scene'
 * -----------------------------------------------------------------------------
 */
 
function Tiles() {
    'use strict';
    this.setup = function(game) {
        this.game = game;
        this.tilemap = new jaws.TileMap({size: [this.game.cells_x, this.game.cells_y], cell_size: [this.game.cell_size, this.game.cell_size]});
        this.back_tilemap = new jaws.TileMap({size: [this.game.cells_x / 2, this.game.cells_y / 2], cell_size: [this.game.cell_size * 2, this.game.cell_size * 2]});

        // Load the first level
        this.load(4);
        //this.reset();
        
    };
    this.reset = function() {
        var tiles = new jaws.SpriteList()
        var x_pos;
        var y_pos;
    
        // Create default Tiles
        // 1. Red brick foundation
        y_pos = 760;
        for (x_pos = 0; x_pos <= 1560; x_pos += 40) {
            tiles.push(new Tile({image: "graphics/small/red_brick_platform_01.png", x: x_pos, y: y_pos, type: 1}));
        }
        // 2. Top girders
        y_pos = 0;
        for (x_pos = 40; x_pos <= 1520; x_pos += 40) {
            tiles.push(new Tile({image: "graphics/small/girder_02a.png", x: x_pos, y: y_pos, type: 1}));
        }
        // 3. Side girders
        for (y_pos = 40; y_pos < 720; y_pos += 40) {
            x_pos = 0;
            tiles.push(new Tile({image: "graphics/small/girder_02.png", x: x_pos, y: y_pos, type: 1}));
            x_pos = 1560;
            tiles.push(new Tile({image: "graphics/small/girder_02.png", x: x_pos, y: y_pos, type: 1}));
        }
        // 4. Border girder boxes
        tiles.push(new Tile({image: "graphics/small/iron_box_04.png", x: 0, y: 0, type: 1}));
        tiles.push(new Tile({image: "graphics/small/iron_box_04.png", x: 1560, y: 0, type: 1}));
        tiles.push(new Tile({image: "graphics/small/iron_box_04.png", x: 0, y: 720, type: 1}));
        tiles.push(new Tile({image: "graphics/small/iron_box_04.png", x: 1560, y: 720, type: 1}));
        
        this.tiles = tiles;
        this.tilemap.push(this.tiles);

        // Create Background Tiles
        tiles.sprites = [];
        for (x_pos = 0; x_pos <= 1520; x_pos += 80) {
            tiles.push(new Tile({image: "graphics/large/wood_tile_01.png", x: x_pos, y: y_pos, type: 0}));
        }
        this.back_tiles = tiles;
        this.back_tilemap.push(this.back_tiles);
        
    };
    this.load = function(level) {
        var imagefile;
        var i;
        var j;

        this.tiles = LevelTiles(level);
        this.tilemap.push(this.tiles);
        
        this.back_tiles = LevelBackdrop(level);
        this.back_tilemap.push(this.back_tiles);
    };
    /*
     * Generates a text string containing the details of the tiles, for saving
     * to file.
     */
    this.to_text = function() {

        var tiles_output =
        "    var xpos;                                                                                                   \n" +
        "    var ypos;                                                                                                   \n" +
        "    // Create default Tiles                                                                                     \n" + 
        "    // 1. Red brick foundation                                                                                  \n" + 
        "    y_pos = 760;                                                                                                \n" + 
        "    for (x_pos = 0; x_pos <= 1560; x_pos += 40) {                                                               \n" + 
        "        tiles.push(new Tile({image: 'graphics/small/red_brick_platform_01.png', x: x_pos, y: y_pos, type: 1})); \n" + 
        "    }                                                                                                           \n" + 
        "    // 2. Top girders                                                                                           \n" + 
        "    y_pos = 0;                                                                                                  \n" + 
        "    for (x_pos = 40; x_pos <= 1520; x_pos += 40) {                                                              \n" + 
        "        tiles.push(new Tile({image: 'graphics/small/girder_02a.png', x: x_pos, y: y_pos, type: 1}));            \n" + 
        "    }                                                                                                           \n" + 
        "    // 3. Side girders                                                                                          \n" + 
        "    for (y_pos = 40; y_pos < 720; y_pos += 40) {                                                                \n" + 
        "        x_pos = 0;                                                                                              \n" + 
        "        tiles.push(new Tile({image: 'graphics/small/girder_02.png', x: x_pos, y: y_pos, type: 1}));             \n" + 
        "        x_pos = 1560;                                                                                           \n" + 
        "        tiles.push(new Tile({image: 'graphics/small/girder_02.png', x: x_pos, y: y_pos, type: 1}));             \n" + 
        "    }                                                                                                           \n" + 
        "    // 4. Border girder boxes                                                                                   \n" + 
        "    tiles.push(new Tile({image: 'graphics/small/iron_box_04.png', x: 0, y: 0, type: 1}));                       \n" + 
        "    tiles.push(new Tile({image: 'graphics/small/iron_box_04.png', x: 1560, y: 0, type: 1}));                    \n" + 
        "    tiles.push(new Tile({image: 'graphics/small/iron_box_04.png', x: 0, y: 720, type: 1}));                     \n" + 
        "    tiles.push(new Tile({image: 'graphics/small/iron_box_04.png', x: 1560, y: 720, type: 1}));                  \n" +
        "    // 5. Level-specific tiles                                                                                  \n";
        
        var backdrop_output = ""
        var x;
        var y;
        var sprite;
        var line;
        for(y = 1; y < this.game.cells_y - 1; y++) {
            for (x = 1; x < this.game.cells_x - 1; x ++) {
                sprite = this.tilemap.cell(x, y)[0];
                if (sprite) {
                    line = "    tiles.push(new Tile({image: '" + sprite.imagefile + "', x: " + sprite.x + ", y: " + sprite.y + ", type: 0}));\n";
                    tiles_output = tiles_output + line;
                }
            }
        }
        tiles_output = "function LevelTiles() {\n" +
                 "    var tiles = new jaws.SpriteList()\n" +
                 tiles_output +
                 "    return tiles;\n" +
                 "}\n";

        for(y = 0; y < this.game.cells_y / 2; y++) {
            for (x = 0; x < this.game.cells_x / 2; x ++) {
                sprite = this.back_tilemap.cell(x, y)[0];
                if (sprite) {
                    line = "    tiles.push(new Tile({image: '" + sprite.imagefile + "', x: " + sprite.x + ", y: " + sprite.y + ", type: 0}));\n";
                    backdrop_output = backdrop_output + line;
                }
            }
        }
        backdrop_output = "function LevelBackdrop() {\n" +
                 "    var tiles = new jaws.SpriteList()\n" +
                 backdrop_output +
                 "    return tiles;\n" +
                 "}\n";

        return tiles_output + backdrop_output;
    }
    this.fill_backdrop = function(imagefile) {
        'use strict';
        var i;
        var j;
        this.back_tilemap.clear();
        this.back_tiles = new jaws.SpriteList();
        for(i = 0; i < this.game.cells_y; i++) {
            for(j = 0; j < this.game.cells_x; j++) {
                this.back_tiles.push(new Tile({image: imagefile, x: j * this.game.cell_size, y: i * this.game.cell_size}));
            }
        }
        this.back_tilemap.push(this.back_tiles);
    }
}

/*
 * -----------------------------------------------------------------------------
 * SmallTileStack - collection of 'small' tiles for building platforms
 * -----------------------------------------------------------------------------
 */
function SmallTileStack() {
    'use strict';
    this.setup = function() {
        this.tiles = [];
        this.tiles.push("graphics/small/red_brick_platform_01.png");
        this.tiles.push("graphics/small/girder_platform_left.png");
        this.tiles.push("graphics/small/girder_platform_middle.png");
        this.tiles.push("graphics/small/girder_platform_right.png");
        this.tiles.push("graphics/small/girder_01.png");
        this.tiles.push("graphics/small/girder_01a.png");
        this.tiles.push("graphics/small/girder_02.png");
        this.tiles.push("graphics/small/girder_02a.png");
        this.tiles.push("graphics/small/iron_box_01.png");
        this.tiles.push("graphics/small/iron_box_02.png");
        this.tiles.push("graphics/small/iron_box_03.png");
        this.tiles.push("graphics/small/iron_box_04.png");
        this.tiles.push("graphics/small/steam_valve_01.png");
        this.first();
    };
    this.first = function() {
        this.pointer = 0;
    }
    this.next = function() {
        this.pointer++;
        if (this.pointer > this.tiles.length - 1) {
            this.pointer = 0;
        }
    }
    this.prior = function() {
        this.pointer--;
        if (this.pointer < 0) {
            this.pointer = this.tiles.length - 1;
        }
    }
    this.last = function() {
        this.pointer = this.tiles.length - 1;
    }
    this.tile = function() {
        return this.tiles[this.pointer];
    }
}

/*
 * -----------------------------------------------------------------------------
 * LargeTileStack - collection of 'small' tiles for building backgrounds
 * -----------------------------------------------------------------------------
 */
function LargeTileStack() {
    'use strict';
    this.setup = function() {
        this.tiles = [];
        this.tiles.push("graphics/large/brass_tile_01.png");
        this.tiles.push("graphics/large/brass_tile_02.png");
        this.tiles.push("graphics/large/concrete_wall_01.png");
        this.tiles.push("graphics/large/corrrugated_iron_01.png");
        this.tiles.push("graphics/large/corrrugated_iron_02.png");
        this.tiles.push("graphics/large/dark_green_metal_fill_01.png");
        this.tiles.push("graphics/large/rusty_iron_01.png");
        this.tiles.push("graphics/large/girder_platform_01.png");
        this.tiles.push("graphics/large/iron_box.png");
        this.tiles.push("graphics/large/iron_box_02.png");
        this.tiles.push("graphics/large/iron_box_03.png");
        this.tiles.push("graphics/large/iron_girder_01.png");
        this.tiles.push("graphics/large/iron_girder_02.png");
        this.tiles.push("graphics/large/iron_girder_03.png");
        this.tiles.push("graphics/large/iron_tile_01.png");
        this.tiles.push("graphics/large/iron_tile_02.png");
        this.tiles.push("graphics/large/iron_tile_05.png");
        this.tiles.push("graphics/large/iron_tile_06.png");
        this.tiles.push("graphics/large/metal_vent_01.png");
        this.tiles.push("graphics/large/metal_vent_02.png");
        this.tiles.push("graphics/large/ornate_tile_01.png");
        this.tiles.push("graphics/large/ornate_tile_02.png");
        this.tiles.push("graphics/large/ornate_tile_03.png");
        this.tiles.push("graphics/large/ornate_tile_04.png");
        this.tiles.push("graphics/large/ornate_tile_05.png");
        this.tiles.push("graphics/large/ornate_tile_07.png");
        this.tiles.push("graphics/large/ornate_tile_08.png");
        this.tiles.push("graphics/large/ornate_tile_09.png");
        this.tiles.push("graphics/large/pulley_01.png");
        this.tiles.push("graphics/large/red_bricks_01.png");
        this.tiles.push("graphics/large/red_bricks_02.png");
        this.tiles.push("graphics/large/red_bricks_03.png");
        this.tiles.push("graphics/large/window_01.png");
        this.tiles.push("graphics/large/wood_tile_01.png");
        this.tiles.push("graphics/large/wood_tile_02.png");
        this.tiles.push("graphics/large/iron_box_04.png");
        this.tiles.push("graphics/large/iron_girder_04.png");
        this.tiles.push("graphics/large/iron_grille_01.png");
        this.tiles.push("graphics/large/iron_grille_02.png");
        this.tiles.push("graphics/large/iron_tile_03.png");
        this.tiles.push("graphics/large/iron_tile_04.png");
        this.tiles.push("graphics/large/ornate_tile_06.png");
        this.first();
    };
    this.first = function() {
        this.pointer = 0;
    }
    this.next = function() {
        this.pointer++;
        if (this.pointer > this.tiles.length - 1) {
            this.pointer = 0;
        }
    }
    this.prior = function() {
        this.pointer--;
        if (this.pointer < 0) {
            this.pointer = this.tiles.length - 1;
        }
    }
    this.tile = function() {
        return this.tiles[this.pointer];
    }
}

/*
 * -----------------------------------------------------------------------------
 * Main state handler.
 * -----------------------------------------------------------------------------
 */
function MainEditorState() {
    'use strict';
    this.setup = function() {
        jaws.preventDefaultKeys( ["down"] );
        
        this.coord_label = $("#cell");
        this.state_button = $("#state");
        this.save_button = $("#save");
        this.left_image_button = $("#image-left");
        this.right_image_button = $("#image-right");
        this.prev_left_tile_button = $("#prev-left-tile");
        this.next_left_tile_button = $("#next-left-tile");
        this.prev_right_tile_button = $("#prev-right-tile");
        this.next_right_tile_button = $("#next-right-tile");
        this.prev_left_backdrop_button = $("#prev-left-backdrop");
        this.next_left_backdrop_button = $("#next-left-backdrop");
        this.left_image = $("#image-left");
        this.right_image = $("#image-right");
        this.backdrop_tile = $("#backdrop-tile");
        this.fill_backdrop_button = $("#fill-backdrop");
        
        this.select_state = 0; // Placing tiles
                    
        this.left_small_tiles = new SmallTileStack();
        this.left_small_tiles.setup();
        $("#image-left img").attr("src", this.left_small_tiles.tile());

        this.right_small_tiles = new SmallTileStack();
        this.right_small_tiles.setup();
        $("#image-right img").attr("src", this.right_small_tiles.tile());

        this.large_tiles = new LargeTileStack();
        this.large_tiles.setup();
        $("#backdrop-tile img").attr("src", this.large_tiles.tile());
        
        this.cells_x = 40; // 60;
        this.cells_y = 20;
        this.cell_size = 40;
        this.max_x = this.cells_x * this.cell_size;
        this.max_y = this.cells_y * this.cell_size;
        this.cursor = new Cursor({x: 0, y:0}, this);
        this.viewport = new jaws.Viewport({max_x: this.max_x, max_y: this.max_y});
        this.back_viewport = new jaws.Viewport({max_x: this.max_x, max_y: this.max_y});
        
        this.sky = new Sky();
        this.sky.setup();
        this.tiles = new Tiles();
        this.tiles.setup(this);
        
        this.state = 1; // Draw
        
        var that = this;
        jaws.on_keyup(["home", "left", "right", "up", "down"], function(key) { that.scroll(key); });
        jaws.on_keydown(["left_mouse_button", "right_mouse_button"], function(key) { that.onclick(key); });
        
        this.state_button.click(function(event) { that.state_toggle(); });
        this.save_button.click(function(event) { that.save(); });
        this.prev_left_tile_button.click(function(event) { that.prev_left_small_tile(); });
        this.next_left_tile_button.click(function(event) { that.next_left_small_tile(); });
        this.prev_right_tile_button.click(function(event) { that.prev_right_small_tile(); });
        this.next_right_tile_button.click(function(event) { that.next_right_small_tile(); });
        this.prev_left_backdrop_button.click(function(event) { that.prev_left_large_tile(); });
        this.next_left_backdrop_button.click(function(event) { that.next_left_large_tile(); });
        this.left_image.click(function(event) { that.select_tile(); });
        this.right_image.click(function(event) { that.select_tile(); });
        this.backdrop_tile.click(function(event) { that.select_backdrop(); });
        this.fill_backdrop_button.click(function(event) { that.fill_backdrop(); });
        
        this.viewport.move(0, this.cell_size * 11);
        this.back_viewport.move(0, this.cell_size * 11);
    };
    this.prev_left_small_tile = function() {
        this.left_small_tiles.prior();
        $("#image-left img").attr("src", this.left_small_tiles.tile());
    }
    this.next_left_small_tile = function() {
        this.left_small_tiles.next();
        $("#image-left img").attr("src", this.left_small_tiles.tile());
    }
    this.prev_right_small_tile = function() {
        this.right_small_tiles.prior();
        $("#image-right img").attr("src", this.right_small_tiles.tile());
    }
    this.next_right_small_tile = function() {
        this.right_small_tiles.next();
        $("#image-right img").attr("src", this.right_small_tiles.tile());
    }
    this.prev_left_large_tile = function() {
        this.large_tiles.prior();
        $("#backdrop-tile img").attr("src", this.large_tiles.tile());
    }
    this.next_left_large_tile = function() {
        this.large_tiles.next();
        $("#backdrop-tile img").attr("src", this.large_tiles.tile());
    }
    this.select_tile = function() {
        this.select_state = 0; // Placing tiles
        this.cells_x = 40;
        this.cells_y = 20;
        this.cell_size = 40;
    }
    this.select_backdrop = function() {
        this.select_state = 1; // Placing backdrop
        this.cells_x = 20;
        this.cells_y = 10;
        this.cell_size = 80;
    }
    this.fill_backdrop = function() {
        this.cells_x = 20;
        this.cells_y = 10;
        this.cell_size = 80;
        this.tiles.fill_backdrop(this.large_tiles.tile());
    }
    this.scroll = function(key) {
        if (key === "home") {
            this.viewport.x = 0;
            this.back_viewport.x = 0;            
        } else if (key === "right") {
            this.viewport.move(40, 0);   
            this.back_viewport.move(40, 0);
        } else if (key === "left") {
            this.viewport.move(-40, 0);
            this.back_viewport.move(-40, 0);
        } else if (key === "up") {
            this.viewport.move(0, -40);
            this.back_viewport.move(0, -40);
        } else if (key === "down") {
            this.viewport.move(0, 40);
            this.back_viewport.move(0, 40);
        }
    };
    this.state_toggle = function() {
        if (this.state === 0) {
            this.state = 1;
            this.state_button.html("Draw");
        } else {
            this.state = 0;
            this.state_button.html("Erase");
        }
    };
    this.onclick = function(key) {
        var xpos = this.cursor.cell_x * this.cell_size;
        var ypos = this.cursor.cell_y * this.cell_size;
        if (jaws.mouse_y < 400) {
            if ((this.cursor.cell_y >= 0) && (this.cursor.cell_y < this.cells_y)) { 
                var sprite = null;
                if (this.state === 0) {
                    if(this.select_state == 0) {
                        this.tiles.tilemap.cells[this.cursor.cell_x][this.cursor.cell_y] = [];
                    } else {
                        this.tiles.back_tilemap.cells[this.cursor.cell_x][this.cursor.cell_y] = [];
                    }
                } else if (key === "left_mouse_button") {
                    if(this.select_state == 0) {
                        sprite = new Tile({image: this.left_small_tiles.tile(), x: xpos, y: ypos});
                    } else {
                        sprite = new Tile({image: this.large_tiles.tile(), x: xpos, y: ypos});
                    }
                } else if (key === "right_mouse_button") {
                    if(this.select_state == 0) {
                        sprite = new Tile({image: this.right_small_tiles.tile(), x: xpos, y: ypos});
                    } else {
                        sprite = new Tile({image: this.large_tiles.tile(), x: xpos, y: ypos});
                    }
                }
                if (sprite) {
                    // jaws.log("adding tile at " + xpos + ", " + ypos);
                    if(this.select_state == 0) {
                        this.tiles.tilemap.cells[this.cursor.cell_x][this.cursor.cell_y] = [];
                        this.tiles.tilemap.pushToCell(this.cursor.cell_x, this.cursor.cell_y, sprite);
                    } else {
                        this.tiles.back_tilemap.cells[this.cursor.cell_x][this.cursor.cell_y] = [];
                        this.tiles.back_tilemap.pushToCell(this.cursor.cell_x, this.cursor.cell_y, sprite);
                    }
                }
            }
        }
    };
    this.update = function() {
        this.cursor.left_cell = Math.floor(this.viewport.x / this.cell_size);
        this.cursor.top_cell = Math.floor(this.viewport.y / this.cell_size);
        this.sky.update();
        this.cursor.update();
        this.coord_label.html("x: " + this.cursor.cell_x + " y: " + this.cursor.cell_y);
    };
    this.draw = function() {
        jaws.clear();
        this.sky.draw();
        this.back_viewport.drawTileMap(this.tiles.back_tilemap);
        this.viewport.drawTileMap(this.tiles.tilemap);
        this.cursor.draw();
    };
    this.save = function() {
        // Under Firefox this will open a new tab with the contents displayed
        // in it. Other browsers might vary.
        var uriContent = "data:text/plain," + encodeURIComponent(this.tiles.to_text());
        var newWindow = window.open(uriContent, 'tiles');
    };
};

jaws.onload = function( ) {
    'use strict';
    // Pre-load the game assets
    jaws.assets.add( [
            "graphics/cursor_01.png",
            "graphics/starry_sky_01.png",
            "graphics/clouds_01.png",
            "graphics/clouds_02.png",
            "graphics/floor_tile_left_01.png",
            "graphics/floor_tile_right_01.png",
            "graphics/wall_tile_01.png",
            "graphics/large/brass_tile_01.png",
            "graphics/large/brass_tile_02.png",
            "graphics/large/concrete_wall_01.png",
            "graphics/large/corrrugated_iron_01.png",
            "graphics/large/corrrugated_iron_02.png",
            "graphics/large/dark_green_metal_fill_01.png",
            "graphics/large/rusty_iron_01.png",
            "graphics/large/girder_platform_01.png",
            "graphics/large/iron_box.png",
            "graphics/large/iron_box_02.png",
            "graphics/large/iron_box_03.png",
            "graphics/large/iron_girder_01.png",
            "graphics/large/iron_girder_02.png",
            "graphics/large/iron_girder_03.png",
            "graphics/large/iron_tile_01.png",
            "graphics/large/iron_tile_02.png",
            "graphics/large/iron_tile_05.png",
            "graphics/large/iron_tile_06.png",
            "graphics/large/metal_vent_01.png",
            "graphics/large/metal_vent_02.png",
            "graphics/large/ornate_tile_01.png",
            "graphics/large/ornate_tile_02.png",
            "graphics/large/ornate_tile_03.png",
            "graphics/large/ornate_tile_04.png",
            "graphics/large/ornate_tile_05.png",
            "graphics/large/ornate_tile_07.png",
            "graphics/large/ornate_tile_08.png",
            "graphics/large/ornate_tile_09.png",
            "graphics/large/pulley_01.png",
            "graphics/large/red_bricks_01.png",
            "graphics/large/red_bricks_02.png",
            "graphics/large/red_bricks_03.png",
            "graphics/large/window_01.png",
            "graphics/large/wood_tile_01.png",
            "graphics/large/wood_tile_02.png",
            "graphics/large/iron_box_04.png",
            "graphics/large/iron_girder_04.png",
            "graphics/large/iron_grille_01.png",
            "graphics/large/iron_grille_02.png",
            "graphics/large/iron_tile_03.png",
            "graphics/large/iron_tile_04.png",
            "graphics/large/ornate_tile_06.png",
            "graphics/large/generator_left_01.png",
            "graphics/large/generator_right_01.png",
            "graphics/small/girder_platform_left.png",
            "graphics/small/girder_platform_right.png",
            "graphics/small/red_brick_platform_01.png",
            "graphics/small/girder_platform_middle.png",
            "graphics/small/girder_01.png",
            "graphics/small/girder_01a.png",
            "graphics/small/girder_02.png",
            "graphics/small/girder_02a.png",
            "graphics/small/iron_box_01.png",
            "graphics/small/iron_box_02.png",
            "graphics/small/iron_box_03.png",
            "graphics/small/iron_box_04.png",
            "graphics/small/steam_valve_01.png"
    ] ); 
    // Start the game running. jaws.start() will handle the game loop for us.
    jaws.start( MainEditorState ); 
};

