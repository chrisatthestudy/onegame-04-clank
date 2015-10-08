/*
 * =============================================================================
 * Clank and the Toy Factory
 * =============================================================================
 * April game for One Game A Month
 *
 * (c) 2013 chrisatthestudy
 * -----------------------------------------------------------------------------
 * See the end of this file for the main entry point
 */

/*
 * Enumerations
 */
//{{{ 
var LVL_STATE = {
    INACTIVE: 0,
    SETUP: 1,
    ENTERING: 2,
    ACTIVE: 3,
    LEAVING: 4,
    TEARDOWN: 5,
    GAMEWON: 6,
    GAMELOST: 7
}

var TYPE = {
    MOBILE: 0,
    STEAM: 1
}

var DLG_STATE = {
    INACTIVE: 0,
    OPENING: 1,
    ACTIVE: 2,
    CLOSING: 3
}
//}}}

/*
 * =============================================================================
 * class FactoryPart (Sprite)
 * =============================================================================
//{{{ 
 * Base class for all objects in the game which can be interacted with in some 
 * way (i.e. almost everything except the background tiles).
 * 
 * Inherited Properties:
 *  - x           | horizontal position  (0 = furthest left)
 *  - y           | vertical position    (0 = top)
 *  - image       | Image/canvas or string pointing to an asset ("player.png")
 *  - alpha       | transparency 0=fully transparent, 1=no transparency
 *  - angle       | angle in degrees (0-360)
 *  - flipped     | flip sprite horizontally
 *  - anchor      | string stating how to anchor the sprite to canvas
 *  - scale_image | scale the sprite by this factor
 *
 * Properties:
 *  - game        | reference to main game context object
 *  - active      | is this part currently active (will it be updated/drawn)?
 *  - hit_points  | how much damage can it sustain (-1 = limitless)
 *  - damage      | how much damage has it sustained?
 *  - destroyed   | has it been destroyed?
 *  - attack      | how much damage does it inflict?
 *
 * Inherited Methods:
 *  - rect()                  | returns bounding rectangle
 *
 * Methods:
 *  - FactoryPart(options)    | constructor
 *  - init(game)              | initialiser - call, but do not override
 *  - setup()                 | called by init() to do object-specific setup
 *  - update()                | update position, state, etc., if active
 *  - draw()                  | draw, if active
 *  - apply_damage(amount)    | apply damage to this part
 *  - collision_below(mobile) | check if mobile is directly on top of this part
 *  - on_collision(mobile)    | handles the effects of collisions
 *
//}}}
 */
 
//{{{ 
// -----------------------------------------------------------------------------
// Constructor
// -----------------------------------------------------------------------------
// This should be replicated **exactly** (with the exception of the name) in 
// any descendant classes. It's a hack, but the only way that I have been able 
// to get inheritance to work.
var FactoryPart = function(options) { 
    'use strict';
    // Call the inherited constructor.
    this.constructor(options);
};

// -----------------------------------------------------------------------------
// prototype
// -----------------------------------------------------------------------------
// Set up prototype to enable inheritance from jaws.Sprite
FactoryPart.prototype = function() {
    'use strict';
    // Create a new, empty object
    var inherited = function() { };
    // Copy the 'Sprite' prototype to it
    inherited.prototype = jaws.Sprite.prototype;
    // Return a new copy of the object
    return new inherited();
}();

// -----------------------------------------------------------------------------
// init(game)
// -----------------------------------------------------------------------------
// Initialises the FactoryPart. This should not be overridden, but instead the
// setup() method should be provided (which will be called at the end of this
// method().
//
// When creating a new part, the init() method MUST be called, immediately
// after actually constructing the part.
FactoryPart.prototype.init = function(game) {
    'use strict';
    
    // Save a reference to the main context
    this.game = game;
    
    // Prevent any actions from happening until setup() has been called
    this.active = false;

    // Do the part-specific setup
    this.setup();
    
    // The mobile is now ready for any other methods to be called on it.
    this.active = true;
};

// -----------------------------------------------------------------------------
// setup()
// -----------------------------------------------------------------------------
// Sets up the part. This can (and usually should be overridden, but this 
// inherited method must be called before performing any other setup:
//
//      FactoryPart.prototype.setup.call(this);
//
FactoryPart.prototype.setup = function() {
    // The amount of damage this part can sustain before being destroyed. The
    // default value of -1 will disable any damage, and the part can never be
    // destroyed.
    this.hit_points = -1;

    // The current damage amount
    this.damage = 0;

    // Has the part been destroyed? By default, update() and draw() will not
    // be called for destroyed parts.
    this.destroyed = false;
    
    // The amount of damage applied to Clank if he collides with this part
    this.attack = 0;
}

// -----------------------------------------------------------------------------
// reset()
// -----------------------------------------------------------------------------
FactoryPart.prototype.reset = function() {
}

// -----------------------------------------------------------------------------
// update()
// -----------------------------------------------------------------------------
// Updates the object, implementing movement, collision-detection, and so on.
// This base version does nothing, but simply ensures that descendant classes
// which do not use update will not cause an exception when update() is called
// (this means that update() can always be safely called on any FactoryPart
// or descendant).
FactoryPart.prototype.update = function() {
    'use strict';    
}

// -----------------------------------------------------------------------------
// draw()
// -----------------------------------------------------------------------------
// Draws the part on-screen, calling the inherited jaws routine. If this is
// overridden, the overriding function should also call inherited, to ensure
// that the default drawing is carried out.
//
// If the part is marked as destroyed, it will not be drawn.
FactoryPart.prototype.draw = function() {
    'use strict';    
    if (this.active) {
        // Call the inherited version
        jaws.Sprite.prototype.draw.call(this);
    }
}

// -----------------------------------------------------------------------------
// apply_damage()
// -----------------------------------------------------------------------------
FactoryPart.prototype.apply_damage = function(amount) {
    // Applies the specified amount of damage to the part, marking it as
    // destroyed if the result exceeds the maximum amount of damage that it can
    // sustain.
    if (this.hit_points > -1) {
        this.damage += amount;
        if (this.damage >= this.hit_points) {
            this.destroyed = true;
        } else if (this.damage < 0) {
            this.damage = 0;
        }
    }
}

// -----------------------------------------------------------------------------
// collision_below
// -----------------------------------------------------------------------------
// Check whether this part is directly below another given part. It should
// be called immediately before moving the other part, and will place it to be
// directly on top of this FactoryPart if a collision is detected.
FactoryPart.prototype.collision_below = function(mobile) {
    'use strict';
    // Ignore any attempt to collide the mobile with itself, and also ignore
    // any mobiles which are moving upwards
    if ((mobile === this) || (mobile.y_speed < 0)) {
        return false;
    } else {
        // For a collision to happen, the left or right bottom edge of the mobile
        // must be no more than y_speed pixels above the top edge of the tile.
        var x;
        var y;
        var result = false;
        // Check left bottom edge
        x = mobile.x;
        y = mobile.y + mobile.rect().height - 1;
        // Is the left bottom point between the borders of this mobile?
        if ((x > this.x) && (x < this.x + this.rect().width)) {
            // Is it just above the top of this mobile?
            if ((y >= this.y - mobile.y_speed) && (y <= this.y)) {
                result = true;
            }
        }
        if (!result) {
            // Is the right bottom point between the borders of this mobile?
            x = mobile.x + mobile.rect().width - 1;
            if ((x > this.x) && (x < this.x + this.rect().width)) {
                // Is it just above the top of this mobile?
                if ((y >= this.y - mobile.y_speed) && (y <= this.y)) {
                    result = true;
                }
            }
        }
        if (result) {
            mobile.y = this.y - mobile.rect().height;
        }
        return result;
    }
};

// -----------------------------------------------------------------------------
// on_collision
// -----------------------------------------------------------------------------
// Handles the effect of the given mobile colliding with this part. By default
// it will apply the 'attack' value to the mobile's 'damage' value. This should
// be called when a collision with this part is detected. It will return true
// if any damage was inflicted.
//
// It is possible for a part to have a negative 'attack' value, in which case
// it essentially 'heals' the mobile. This will return false, as no damage was
// inflicted.
FactoryPart.prototype.on_collision = function(mobile) {
    mobile.apply_damage(this.attack);
    return ((this.attack > 0) && (!mobile.invulnerable()));        
};

// -----------------------------------------------------------------------------
// Returns true if this part cannot be damaged or destroyed
// -----------------------------------------------------------------------------
FactoryPart.prototype.invulnerable = function() {
    return (this.hit_points == -1);
}
//}}}

/*
 * =============================================================================
 * class Fixture (FactoryPart)
 * =============================================================================
//{{{
 * Base class for fixed items (other than tiles)
 *
 * Properties:
 *  - anim        | animation (defaults to the Sprite image)
 *  - timer       | fixtures commonly 'fire' at specific intervals
 *  - interval    | seconds of interval between activations of the fixture (0 deactivates)
 *  - duration    | number of seconds to 'fire' for
 *  - delay       | seconds of delay before starting the timer
 *
 * Inherited Properties:
 *  - x           | horizontal position  (0 = furthest left)
 *  - y           | vertical position    (0 = top)
 *  - image       | Image/canvas or string pointing to an asset ("player.png")
 *  - alpha       | transparency 0=fully transparent, 1=no transparency
 *  - angle       | angle in degrees (0-360)
 *  - flipped     | flip sprite horizontally
 *  - anchor      | string stating how to anchor the sprite to canvas
 *  - scale_image | scale the sprite by this factor
 *  - game        | reference to main game context object
 *  - active      | is this part currently active (will it be updated/drawn)?
 *  - hit_points  | how much damage can it sustain (-1 = limitless)
 *  - damage      | how much damage has it sustained?
 *  - destroyed   | has it been destroyed?
 *  - attack      | how much damages does it inflict?
 *
 * Methods:
 *  - Fixture(options)        | constructor
 *
 * Inherited Methods:
 *  - init(game)              | initialiser - call, but do not override
 *  - setup()                 | called by init() to do object-specific setup
 *  - update()                | update position, state, etc., if active
 *  - draw()                  | draw, if active
 *  - apply_damage(amount)    | apply damage to this part
 *  - collision_below(mobile) | check if mobile is directly on top of this part
 *  - rect()                  | returns bounding rectangle
 *
//}}}
 */

//{{{ 
// -----------------------------------------------------------------------------
// Constructor
// -----------------------------------------------------------------------------
var Fixture = function(options) { 
    'use strict';
    // Call the inherited constructor.
    this.constructor(options);
};

// -----------------------------------------------------------------------------
// Prototype
// -----------------------------------------------------------------------------
// Set up prototype to enable inheritance from FactoryPart
Fixture.prototype = function() {
    'use strict';
    // Create a new, empty object
    var inherited = function() { };
    // Copy the 'FactoryPart' prototype to it
    inherited.prototype = FactoryPart.prototype;
    // Return a new copy of the object
    return new inherited();
}();

// -----------------------------------------------------------------------------
// setup()
// -----------------------------------------------------------------------------
// Sets up the Fixture. This can be overridden, but this inherited method
// should be called before performing any other setup:
//
//      Fixture.prototype.setup.call(this);
//
Fixture.prototype.setup = function() {
    'use strict';
    // Call the inherited setup()
    FactoryPart.prototype.setup.call(this);

    // Load the animation. Use the default image if no animation has been 
    // specified
    var image = this.options.anim || this.options.image;
    var size = this.options.frame_size || [40, 40];
    var duration = this.options.frame_duration || 100;
    this.anim = new jaws.Animation({sprite_sheet: image, frame_size: size, frame_duration: duration})
    this.setImage(this.anim.currentFrame());
    this.interval = this.options.interval || 0;
    this.delay = this.options.delay || 0;
    this.duration = this.options.duration || 0;
    this.firing = false;
    if (this.delay > 0) {
        this.countdown = this.game.timer.start_countdown(this.delay);
    } else {
        this.countdown = null;
    }
};

// -----------------------------------------------------------------------------
// update()
// -----------------------------------------------------------------------------
Fixture.prototype.update = function() {
    'use strict';
    if ((this.countdown) && (this.countdown.expired)) {
        if (this.firing) {
            this.stop();
        } else {
            this.start();
        }
    }
};

// -----------------------------------------------------------------------------
// start()
// -----------------------------------------------------------------------------
Fixture.prototype.start = function() {
    this.firing = true;
    if (this.duration > 0) {
        this.countdown.reset(this.duration);
    }
};

// -----------------------------------------------------------------------------
// stop()
// -----------------------------------------------------------------------------
Fixture.prototype.stop = function() {
    this.firing = false;
    if (this.interval > 0) {
        this.countdown.reset(this.interval);
    }
};
//}}}

/*
 * =============================================================================
 * class Switch (Fixture)
 * =============================================================================
//{{{ 
  * Properties:
 *  - is_on       | current state of switch
 *
 * Inherited Properties:
 *  - x           | horizontal position  (0 = furthest left)
 *  - y           | vertical position    (0 = top)
 *  - image       | Image/canvas or string pointing to an asset ("player.png")
 *  - alpha       | transparency 0=fully transparent, 1=no transparency
 *  - angle       | angle in degrees (0-360)
 *  - flipped     | flip sprite horizontally
 *  - anchor      | string stating how to anchor the sprite to canvas
 *  - scale_image | scale the sprite by this factor
 *  - game        | reference to main game context object
 *  - active      | is this part currently active (will it be updated/drawn)?
 *  - hit_points  | how much damage can it sustain (-1 = limitless)
 *  - damage      | how much damage has it sustained?
 *  - destroyed   | has it been destroyed?
 *  - attack      | how much damages does it inflict?
 *  - anim        | animation (defaults to the Sprite image)
 *  - timer       | fixtures commonly 'fire' at specific intervals
 *  - interval    | seconds of interval between activations of the fixture (0 deactivates)
 *  - duration    | number of seconds to 'fire' for
 *  - delay       | seconds of delay before starting the timer
 *
 * Methods:
 *  - Switch(options)        | constructor
 *
 * Inherited Methods:
 *  - init(game)              | initialiser - call, but do not override
 *  - setup()                 | called by init() to do object-specific setup
 *  - update()                | update position, state, etc., if active
 *  - draw()                  | draw, if active
 *  - apply_damage(amount)    | apply damage to this part
 *  - collision_below(mobile) | check if mobile is directly on top of this part
 *  - rect()                  | returns bounding rectangle
 *
//}}}
 */

//{{{ 
// -----------------------------------------------------------------------------
// Constructor
// -----------------------------------------------------------------------------
// Constructor. This should be replicated **exactly** (with the exception of
// the name) in any descendant classes. It's a hack, but the only way that I
// have been able to get inheritance to work.
var Switch = function(options) { 
    'use strict';
    // Call the inherited constructor.
    this.constructor(options);
};

// -----------------------------------------------------------------------------
// Prototype
// -----------------------------------------------------------------------------
// Set up prototype to enable inheritance from Fixture
Switch.prototype = function() {
    'use strict';
    // Create a new, empty object
    var inherited = function() { };
    // Copy the 'FactoryPart' prototype to it
    inherited.prototype = Fixture.prototype;
    // Return a new copy of the object
    return new inherited();
}();

// -----------------------------------------------------------------------------
// setup()
// -----------------------------------------------------------------------------
// Sets up the Switch.
Switch.prototype.setup = function() {
    // Call the inherited setup()
    Fixture.prototype.setup.call(this);
};

// -----------------------------------------------------------------------------
// on_collision()
// -----------------------------------------------------------------------------
// Overrides the on_collision method to allow Clank to 'flip' the switch
Switch.prototype.on_collision = function(mobile) {
    if ((mobile == this.game.clank) && (!this.is_on)) {
        this.is_on = true;
        this.anim.index = 1;
        this.setImage(this.anim.currentFrame());
    }
}
//}}}

/* 
 * =============================================================================
 * class Steam Jet (Fixture)
 * =============================================================================
//{{{ 
  * Inherited Properties:
 *  - x           | horizontal position  (0 = furthest left)
 *  - y           | vertical position    (0 = top)
 *  - image       | Image/canvas or string pointing to an asset ("player.png")
 *  - alpha       | transparency 0=fully transparent, 1=no transparency
 *  - angle       | angle in degrees (0-360)
 *  - flipped     | flip sprite horizontally
 *  - anchor      | string stating how to anchor the sprite to canvas
 *  - scale_image | scale the sprite by this factor
 *  - game        | reference to main game context object
 *  - active      | is this part currently active (will it be updated/drawn)?
 *  - hit_points  | how much damage can it sustain (-1 = limitless)
 *  - damage      | how much damage has it sustained?
 *  - destroyed   | has it been destroyed?
 *  - attack      | how much damages does it inflict?
 *  - anim        | animation (defaults to the Sprite image)
 *  - timer       | fixtures commonly 'fire' at specific intervals
 *  - interval    | seconds of interval between activations of the fixture (0 deactivates)
 *  - duration    | number of seconds to 'fire' for
 *  - delay       | seconds of delay before starting the timer
 *
 * Methods:
 *  - Switch(options)        | constructor
 *
 * Inherited Methods:
 *  - init(game)              | initialiser - call, but do not override
 *  - setup()                 | called by init() to do object-specific setup
 *  - update()                | update position, state, etc., if active
 *  - draw()                  | draw, if active
 *  - apply_damage(amount)    | apply damage to this part
 *  - collision_below(mobile) | check if mobile is directly on top of this part
 *  - rect()                  | returns bounding rectangle
//}}}
 */
 
//{{{ 
// -----------------------------------------------------------------------------
// Constructor
// -----------------------------------------------------------------------------
var SteamJet = function(options) {
    'use strict';
    // Call the inherited constructor.
    this.constructor(options);
};

// -----------------------------------------------------------------------------
// prototype
// -----------------------------------------------------------------------------
// Set up prototype to enable inheritance from Mobile
SteamJet.prototype = (function() {
    'use strict';
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = Fixture.prototype;
    return new inherited;
})();

// -----------------------------------------------------------------------------
// setup()
// -----------------------------------------------------------------------------
SteamJet.prototype.setup = function() {
    'use strict';
    // Call the inherited version
    Fixture.prototype.setup.call(this);
    this.anim.frame_duration = 200;
};

// -----------------------------------------------------------------------------
// update()
// -----------------------------------------------------------------------------
SteamJet.prototype.update = function() {
    'use strict';
    Fixture.prototype.update.call(this);
    if (this.firing) {
        this.attack = 1;
        this.setImage(this.anim.next());
    } else {
        this.attack = 0;
        this.anim.index = 0;
    }
};

// -----------------------------------------------------------------------------
// draw()
// -----------------------------------------------------------------------------
SteamJet.prototype.draw = function() {
    'use strict';
    if (this.firing) {
        Fixture.prototype.draw.call(this);
    }
};
//}}}

/*
 * =============================================================================
 * class Mobile (FactoryPart)
 * =============================================================================
//{{{
 * Base class for moving objects
 *
 * Properties:
 *  - anim        | animation (defaults to the Sprite image)
 *  - x_speed     | horizontal speed (can be negative)
 *  - y_speed     | vertical speed (can be negative)
 *  - max_x       | maximum x_speed
 *  - max_y       | maximum y_speed   
 *  - on_platform | is the mobile currently on a platform or floor?
 *  - gravity     | gravity applied each tick if the mobile is not on a platform
 *
 * Inherited Properties:
 *  - x           | horizontal position  (0 = furthest left)
 *  - y           | vertical position    (0 = top)
 *  - image       | Image/canvas or string pointing to an asset ("player.png")
 *  - alpha       | transparency 0=fully transparent, 1=no transparency
 *  - angle       | angle in degrees (0-360)
 *  - flipped     | flip sprite horizontally
 *  - anchor      | string stating how to anchor the sprite to canvas
 *  - scale_image | scale the sprite by this factor
 *  - game        | reference to main game context object
 *  - active      | is this part currently active (will it be updated/drawn)?
 *  - hit_points  | how much damage can it sustain (-1 = limitless)
 *  - damage      | how much damage has it sustained?
 *  - destroyed   | has it been destroyed?
 *  - attack      | how much damage does it inflict?
 *
 * Methods:
 *  - Mobile(options)         | constructor
 *  - use_right_anim()        | switches to the right-facing animation
 *  - use_left_anim()         | switches to the left-facing animation
 *
 * Inherited Methods:
 *  - init(game)              | initialiser - call, but do not override
 *  - setup()                 | called by init() to do object-specific setup
 *  - update()                | update position, state, etc., if active
 *  - draw()                  | draw, if active
 *  - apply_damage(amount)    | apply damage to this part
 *  - collision_below(mobile) | check if mobile is directly on top of this part
 *  - rect()                  | returns bounding rectangle
 *
//}}}
 */
//{{{ 
// -----------------------------------------------------------------------------
// Constructor
// -----------------------------------------------------------------------------
// Constructor. This should be replicated **exactly** (with the exception of
// the name) in any descendant classes. It's a hack, but the only way that I
// have been able to get inheritance to work.
var Mobile = function(options) { 
    'use strict';
    // Call the inherited constructor.
    this.constructor(options);
};

// -----------------------------------------------------------------------------
// Prototype
// -----------------------------------------------------------------------------
// Set up prototype to enable inheritance from FactoryPart
Mobile.prototype = function() {
    'use strict';
    // Create a new, empty object
    var inherited = function() { };
    // Copy the 'FactoryPart' prototype to it
    inherited.prototype = FactoryPart.prototype;
    // Return a new copy of the object
    return new inherited();
}();

// -----------------------------------------------------------------------------
// setup()
// -----------------------------------------------------------------------------
// Sets up the mobile. This should be overridden, but this inherited method
// should be called before performing any other setup:
//
//      Mobile.prototype.setup.call(this);
//
Mobile.prototype.setup = function() {
    // Call the inherited setup()
    FactoryPart.prototype.setup.call(this);

    // Load the left-facing animation. Use the default image if no animation
    // has been specified
    var image = this.options.left_anim || this.options.image;
    var size = this.options.frame_size || [40, 40];
    var duration = this.options.frame_duration || 100;
    this.left_anim = new jaws.Animation({sprite_sheet: image, frame_size: size, frame_duration: duration})

    this.range = this.options.range || [0, 0, this.game.max_x, this.game.max_y];
    
    // Load the right-facing animation. Use the left animation if no right
    // animation has been specified, and simply reverse the direction when
    // moving to the right.
    image = this.options.right_anim || image;
    this.right_anim = new jaws.Animation({sprite_sheet: image, frame_size: size, frame_duration: duration})
    if (this.options.right_anim) {
        this.use_reverse_anim = false;
    } else {
        this.use_reverse_anim = true;
    }

    // Start by moving left
    this.anim = this.left_anim;
    
    // How fast is this mobile moving horizontally (can be negative)
    this.x_speed = 0;
    
    // How fast is this mobile moving vertically (can be negative)
    this.y_speed = 0;
    
    // What is the fastest x_speed possible for this mobile? This is a relative
    // value -- the mobile can be moving negatively or positively up to the
    // abs() of this value.
    this.max_x = 0;
    
    // What is the fastest y_speed possible for this mobile? This is a relative
    // value -- the mobile can be moving negatively or positively up to the
    // abs() of this value.
    this.max_y = 0;
    
    // How much gravity should be applied in each tick if the mobile is not on
    // a platform?
    this.gravity = this.options.gravity || 0.2;
    
    // Is the mobile currently on a platform or floor? Mobiles which are not
    // affected by gravity are treated as always being on a platform.
    this.on_platform = (this.gravity == 0);
    
};

// -----------------------------------------------------------------------------
// use_right_anim
// -----------------------------------------------------------------------------
// Switches to the right-facing animation if one is in use, otherwise simply
// reverses the frame direction of the default animation.
Mobile.prototype.use_right_anim = function() {
    if(this.use_reverse_anim) {
        this.anim.frame_direction = -1;
    } else {
        this.anim = this.right_anim;
    }
}

// -----------------------------------------------------------------------------
// use_left_anim
// -----------------------------------------------------------------------------
// Switches to the left-facing (default) animation
Mobile.prototype.use_left_anim = function() {
    if(this.use_reverse_anim) {
        this.anim.frame_direction = 1;
    } else {
        this.anim = this.left_anim;
    }
}
//}}}

/*
 * =============================================================================
 * class Battery (Mobile)
 * =============================================================================
//{{{
 * Collectable object that restores energy
 *
 * Properties:
 *
 * Inherited Properties:
 *  - anim        | animation (defaults to the Sprite image)
 *  - x_speed     | horizontal speed (can be negative)
 *  - y_speed     | vertical speed (can be negative)
 *  - max_x       | maximum x_speed
 *  - max_y       | maximum y_speed   
 *  - on_platform | is the mobile currently on a platform or floor?
 *  - gravity     | gravity applied each tick if the mobile is not on a platform
 *  - x           | horizontal position  (0 = furthest left)
 *  - y           | vertical position    (0 = top)
 *  - image       | Image/canvas or string pointing to an asset ("player.png")
 *  - alpha       | transparency 0=fully transparent, 1=no transparency
 *  - angle       | angle in degrees (0-360)
 *  - flipped     | flip sprite horizontally
 *  - anchor      | string stating how to anchor the sprite to canvas
 *  - scale_image | scale the sprite by this factor
 *  - game        | reference to main game context object
 *  - active      | is this part currently active (will it be updated/drawn)?
 *  - hit_points  | how much damage can it sustain (-1 = limitless)
 *  - damage      | how much damage has it sustained?
 *  - destroyed   | has it been destroyed?
 *  - attack      | how much damage does it inflict?
 *
 * Methods:
 *  - Battery(options)    | constructor
 *
 * Inherited Methods:
 *  - init(game)              | initialiser - call, but do not override
 *  - setup()                 | called by init() to do object-specific setup
 *  - update()                | update position, state, etc., if active
 *  - draw()                  | draw, if active
 *  - apply_damage(amount)    | apply damage to this part
 *  - collision_below(mobile) | check if mobile is directly on top of this part
 *  - rect()                  | returns bounding rectangle
 *  - use_right_anim()        | switches to the right-facing animation
 *  - use_left_anim()         | switches to the left-facing animation
//}}}
 */

//{{{ 
// -----------------------------------------------------------------------------
// Constructor
// -----------------------------------------------------------------------------
var Battery = function(options) {
    'use strict';
    // Call the inherited constructor.
    this.constructor(options);
};

// -----------------------------------------------------------------------------
// prototype
// -----------------------------------------------------------------------------
// Set up prototype to enable inheritance from Mobile
Battery.prototype = (function() {
    'use strict';
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = Mobile.prototype;
    return new inherited;
})();

// -----------------------------------------------------------------------------
// setup()
// -----------------------------------------------------------------------------
Battery.prototype.setup = function() {
    'use strict';
    // Call the inherited version
    Mobile.prototype.setup.call(this);
    // Create the animation
    this.setImage(this.anim.currentFrame());
    // See the Mobile() constructor for the meaning of these variables.
    this.hit_points = 1;
    this.attack = -1;
    this.x_speed = 0.0;
    this.y_speed = 0;
    this.max_x = 1.0;
    this.max_y = 8.0;
    this.on_platform = false;
    this.gravity = 2.0;
};

// -----------------------------------------------------------------------------
// update()
// -----------------------------------------------------------------------------
Battery.prototype.update = function() {
    'use strict';
    if (this.active) {
        // Is there a platform immediately beneath us?
        if (this.game.platform_controller.collision_below(this)) {
            this.on_platform = true;
        } else {
            this.on_platform = false;
        }
        if (!this.on_platform) {
            // Is there a tile immediately beneath us?
            if (this.game.tiles.collision_below(this)) {
                this.on_platform = true;
            } else {
                this.on_platform = false;
            }
        }
        this.setImage(this.anim.next());
        // Apply gravity (just in case)
        if (!this.on_platform) {
            this.y = this.y + this.y_speed;
            if (this.y_speed < this.max_y) {
                this.y_speed = this.y_speed + this.gravity;
            }
        } else {
            this.gravity = 2.0;
        }
    }
};

// -----------------------------------------------------------------------------
// on_collision
// -----------------------------------------------------------------------------
// Handles the effect of the given mobile colliding with this part. By default
// it will apply the 'attack' value to the mobile's 'damage' value. This should
// be called when a collision with this part is detected. It will return true
// if any damage was inflicted.
//
// It is possible for a part to have a negative 'attack' value, in which case
// it essentially 'heals' the mobile. This will return false, as no damage was
// inflicted.
Battery.prototype.on_collision = function(mobile) {
    result = Mobile.prototype.on_collision.call(this, mobile);
    if (mobile == this.game.clank) {
        this.destroyed = true;
    }
    return result;        
};
//}}}

/*
 * =============================================================================
 * class MobileEnemy (Mobile)
 * =============================================================================
//{{{
 * A moving hostile object
 *
 * Properties:
 *
 * Inherited Properties:
 *  - anim        | animation (defaults to the Sprite image)
 *  - x_speed     | horizontal speed (can be negative)
 *  - y_speed     | vertical speed (can be negative)
 *  - max_x       | maximum x_speed
 *  - max_y       | maximum y_speed   
 *  - on_platform | is the mobile currently on a platform or floor?
 *  - gravity     | gravity applied each tick if the mobile is not on a platform
 *  - x           | horizontal position  (0 = furthest left)
 *  - y           | vertical position    (0 = top)
 *  - image       | Image/canvas or string pointing to an asset ("player.png")
 *  - alpha       | transparency 0=fully transparent, 1=no transparency
 *  - angle       | angle in degrees (0-360)
 *  - flipped     | flip sprite horizontally
 *  - anchor      | string stating how to anchor the sprite to canvas
 *  - scale_image | scale the sprite by this factor
 *  - game        | reference to main game context object
 *  - active      | is this part currently active (will it be updated/drawn)?
 *  - hit_points  | how much damage can it sustain (-1 = limitless)
 *  - damage      | how much damage has it sustained?
 *  - destroyed   | has it been destroyed?
 *  - attack      | how much damages does it inflict?
 *
 * Methods:
 *  - MobileEnemy(options)    | constructor
 *
 * Inherited Methods:
 *  - init(game)              | initialiser - call, but do not override
 *  - setup()                 | called by init() to do object-specific setup
 *  - update()                | update position, state, etc., if active
 *  - draw()                  | draw, if active
 *  - apply_damage(amount)    | apply damage to this part
 *  - collision_below(mobile) | check if mobile is directly on top of this part
 *  - rect()                  | returns bounding rectangle
 *  - use_right_anim()        | switches to the right-facing animation
 *  - use_left_anim()         | switches to the left-facing animation
 *
//}}}
 */

//{{{ 
// -----------------------------------------------------------------------------
// Constructor
// -----------------------------------------------------------------------------
var MobileEnemy = function(options) {
    'use strict';
    // Call the inherited constructor.
    this.constructor(options);
};

// -----------------------------------------------------------------------------
// prototype
// -----------------------------------------------------------------------------
// Set up prototype to enable inheritance from Mobile
MobileEnemy.prototype = (function() {
    'use strict';
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = Mobile.prototype;
    return new inherited;
})();

// -----------------------------------------------------------------------------
// setup()
// -----------------------------------------------------------------------------
MobileEnemy.prototype.setup = function() {
    'use strict';
    // Call the inherited version
    Mobile.prototype.setup.call(this);
    // Create the animation
    this.setImage(this.anim.currentFrame());
    // Read the details from the originally-supplied options
    this.hit_points = this.options.hit_points || -1;
    this.attack = this.options.attack || 1;
    // See the Mobile() constructor for the meaning of these variables.
    this.x_speed = this.options.x_speed || -1.0;
    this.y_speed = this.options.y_speed || 0;
    this.max_x = 1.0;
    this.max_y = 8.0;
};

// -----------------------------------------------------------------------------
// update()
// -----------------------------------------------------------------------------
MobileEnemy.prototype.update = function() {
    'use strict';
    if (this.active) {
        if (this.gravity != 0) {
            // Is there a platform immediately beneath us?
            if (this.game.platform_controller.collision_below(this)) {
                this.on_platform = true;
            } else {
                this.on_platform = false;
            }
            if (!this.on_platform) {
                // Is there a tile immediately beneath us?
                if (this.game.tiles.collision_below(this)) {
                    this.on_platform = true;
                } else {
                    this.on_platform = false;
                }
            }
        } else {
            // If gravity does not apply to this MobileEnemy, treat is as
            // always being on a platform
            this.on_platform = true;
        }
        this.setImage(this.anim.next());
        if (this.x + this.x_speed < this.range[0]) {
            // If the range allows the mobile to go offscreen, bring it back on
            // from the opposite side, otherwise flip its direction
            if (this.range[0] < 0) {
                this.x = this.range[2];
            } else {
                this.x = this.range[0];
                this.x_speed = -this.x_speed;
            }
            if (this.x_speed < 0) {
                this.use_left_anim();
            } else {
                this.use_right_anim();
            }
        } else if (this.x + this.x_speed + this.width > this.range[2]) {
            // If the range allows the mobile to go offscreen, bring it back on
            // from the opposite side, otherwise flip its direction
            if (this.range[2] > this.game.max_x) {
                this.x = this.range[0] - this.width;
            } else {
                this.x = this.range[2] - this.width;
                this.x_speed = -this.x_speed;
            }
            if (this.x_speed < 0) {
                this.use_left_anim();
            } else {
                this.use_right_anim();
            }
        } else if (this.game.tiles.collision_to_left(this) || this.game.tiles.collision_to_right(this)) {
            this.x_speed = -this.x_speed;
            if (this.x_speed < 0) {
                this.use_left_anim();
            } else {
                this.use_right_anim();
            }
        } 
        this.x = this.x + this.x_speed;
        // Apply gravity
        if (!this.on_platform) {
            this.y = this.y + this.y_speed;
            if (this.y_speed < this.max_y) {
                this.y_speed = this.y_speed + this.gravity;
            }
        }
    }
};
//}}}

/*
 * =============================================================================
 * class UIPart (jaws.Sprite)
 * =============================================================================
//{{{ 
  * Properties:
 *  - game        | reference to main game context object
 *  - active      | is this part currently active (will it be updated/drawn)?
 *  - value       | value to be displayed
 *  - anim        | animation (defaults to the Sprite image)
 *
 * Inherited Properties:
 *  - x           | horizontal position  (0 = furthest left)
 *  - y           | vertical position    (0 = top)
 *  - image       | Image/canvas or string pointing to an asset ("player.png")
 *  - alpha       | transparency 0=fully transparent, 1=no transparency
 *  - angle       | angle in degrees (0-360)
 *  - flipped     | flip sprite horizontally
 *  - anchor      | string stating how to anchor the sprite to canvas
 *  - scale_image | scale the sprite by this factor
 *
 * Inherited Methods:
 *  - rect()                  | returns bounding rectangle
 *
 * Methods:
 *  - FactoryPart(options)    | constructor
 *  - init(game)              | initialiser - call, but do not override
 *  - setup()                 | called by init() to do object-specific setup
 *  - update()                | update position, state, etc., if active
 *  - draw()                  | draw, if active
 *  - adjust_value(increment) | amends the value (increment can be negative)             
 *
//}}}
 */
//{{{ 
// -----------------------------------------------------------------------------
// Constructor
// -----------------------------------------------------------------------------
var UIPart = function(options) {
};

// -----------------------------------------------------------------------------
// Prototype
// -----------------------------------------------------------------------------
// Set up prototype to enable inheritance from Sprite
UIPart.prototype = function() {
    'use strict';
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = jaws.Sprite.prototype;
    return new inherited;
}();

// -----------------------------------------------------------------------------
// init(game)
// -----------------------------------------------------------------------------
// Initialises the part
UIPart.prototype.init = function(game) {
    'use strict';
    
    this.active = false;
    
    // Keep a reference to the main game context
    this.game = game
    
    // Do the setup
    this.setup();
    
    // Activate the object
    this.active = true;
};

// -----------------------------------------------------------------------------
// setup()
// -----------------------------------------------------------------------------
// Sets up the part
UIPart.prototype.setup = function() {
    // Set up the value
    this.min_value = this.options.min_value || 0;
    this.max_value = this.options.max_value || 10;
    this.value     = this.options.value || this.min_value;
    // Load the animation, defaulting to the sprite image
    var image = this.options.anim || this.options.image;
    var size = this.options.frame_size || [40, 40];
    var duration = this.options.frame_duration || 100;
    this.anim = new jaws.Animation({sprite_sheet: image, frame_size: size, frame_duration: duration})
};

// -----------------------------------------------------------------------------
// update()
// -----------------------------------------------------------------------------
// Updates the part, ensuring that it displays the current value.
UIPart.prototype.update = function() {
    'use strict';
};

// -----------------------------------------------------------------------------
// draw()
// -----------------------------------------------------------------------------
// Draws the part on-screen, if active
UIPart.prototype.draw = function() {
    'use strict';
    jaws.Sprite.prototype.draw.call(this);
};

// -----------------------------------------------------------------------------
// adjust_value(increment)
// -----------------------------------------------------------------------------
// Sets a new value for the control.
UIPart.prototype.adjust_value = function(increment) {
    'use strict';
    var new_value = this.value + increment;
    if ((new_value >= this.min_value) && (new_value <= this.max_value)) {
        this.value = new_value;
    }
};
//}}}

/*
 * =============================================================================
 * Energy Indicator (UIPart)
 * =============================================================================
 */
//{{{ 
// -----------------------------------------------------------------------------
// Constructor
// -----------------------------------------------------------------------------
var EnergyIndicator = function(options) {
    'use strict';
    // Call the inherited constructor.
    this.constructor(options);
};

// -----------------------------------------------------------------------------
// Prototype
// -----------------------------------------------------------------------------
// Set up prototype to enable inheritance from FactoryPart
EnergyIndicator.prototype = function() {
    'use strict';
    // Create a new, empty object
    var inherited = function() { };
    // Copy the 'FactoryPart' prototype to it
    inherited.prototype = UIPart.prototype;
    // Return a new copy of the object
    return new inherited();
}();

// -----------------------------------------------------------------------------
// setup()
// -----------------------------------------------------------------------------
// Sets up the Energy Indicator
EnergyIndicator.prototype.setup = function() {
    'use strict';
    UIPart.prototype.setup.call(this);
};

// -----------------------------------------------------------------------------
// update()
// -----------------------------------------------------------------------------
// Updates the Energy Indicator, amending the image to display the current damage
// state.
EnergyIndicator.prototype.update = function() {
    this.value = this.game.clank.damage;
    if (this.value > this.anim.frames.length - 1) {
        this.value = this.anim.frames.length - 1;
    } 
    this.anim.index = this.value;
    this.setImage(this.anim.currentFrame());
};
//}}}

/*
 * =============================================================================
 * class Clank (Mobile) - the player's character
 * =============================================================================
 */
//{{{ 
// -----------------------------------------------------------------------------
// Constructor
// -----------------------------------------------------------------------------
Clank = function(options, game) {
    'use strict';
    // Call the inherited constructor.
    this.constructor(options);
}
// -----------------------------------------------------------------------------
// prototype
// -----------------------------------------------------------------------------
// Set up prototype to enable inheritance from Mobile
Clank.prototype = (function() {
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = Mobile.prototype;
    return new inherited;
})();

// -----------------------------------------------------------------------------
// setup()
// -----------------------------------------------------------------------------
Clank.prototype.setup = function() {
    'use strict';
    this.active = false;
    // Call the inherited version
    Mobile.prototype.setup.call(this);
    // Create the animations
    this.right_anim = new jaws.Animation({sprite_sheet: "graphics/clank_01a.png", frame_size: [40, 80], frame_duration: 100, bounce: 1})
    this.left_anim = new jaws.Animation({sprite_sheet: "graphics/clank_01b.png", frame_size: [40, 80], frame_duration: 100, bounce: 1})
    this.entering_anim = new jaws.Animation({sprite_sheet: "graphics/clank_approaching_01.png", frame_size: [40, 80], frame_duration: 100, loop: 0})
    this.damage_anim = new jaws.Animation({sprite_sheet: "graphics/clank_damage_01.png", frame_size: [40, 80], frame_duration: 25, loop: 0});
    this.anim = this.entering_anim;
    this.jet_active = false;
    this.moving = false;
    this.attack = 1;
    // See the Mobile() constructor for the meaning of these variables.
    this.hit_points = 4;
    this.x_speed = -1.0;
    this.y_speed = 0;
    this.max_x = 3.0;
    this.max_y = 10.0;
    this.on_platform = false;
    this.gravity = 2.0;
    // Set up a countdown to track the time when Clank is safe from being damaged.
    // This is generally for a short time after damage has happened (to prevent
    // repeated damage from the same collision).
    this.safety_countdown = this.game.timer.start_countdown(0);
    this.safety_time = 1;
    // Set up the Energy Indicator
    this.energy_indicator = new EnergyIndicator({image: "graphics/energy_01.png", frame_size: [193, 28], frame_duration: 100, x: 0, y: 372, max_value: 5});
    this.energy_indicator.init(this.game);
};

// -----------------------------------------------------------------------------
// update()
// -----------------------------------------------------------------------------
Clank.prototype.update = function() {
    if(this.active) {
        // Is there a platform immediately beneath us?
        if (this.game.platform_controller.collision_below(this)) {
            this.on_platform = true;
            this.y_speed = 0;
        } else {
            this.on_platform = false;
        }
        // If not is there a tile immediately beneath us?
        if (!this.on_platform) {
            if (this.game.tiles.collision_below(this)) {
                this.on_platform = true;
            } else {
                this.on_platform = false;
            }
        }
    
        this.moving = false;
        // Set the animation image
        this.setImage(this.anim.next());
        if(jaws.pressed("left"))  {
            if (this.x_speed >= 0) {
                this.setImage(this.entering_anim.currentFrame());
            }
            if (this.x_speed > -this.max_x) {
                this.x_speed = this.x_speed - 0.1;
            } else {
                this.x_speed = -this.max_x;
            }
            this.anim = this.left_anim;
            this.moving = true;
        }
        if(jaws.pressed("right")) {
            if (this.x_speed <= 0) {
                this.setImage(this.entering_anim.currentFrame());
            }
            if (this.x_speed < this.max_x) {
                this.x_speed = this.x_speed + 0.1;
            } else {
                this.x_speed = this.max_x;
            }
            this.anim = this.right_anim;
            this.moving = true;
        }
        if(jaws.pressed("up") && (this.on_platform)) {
            this.jet_active = true;
            this.y_speed = -this.max_y;
            this.gravity = 2.0;
        } else if ((!jaws.pressed("up")) && (this.y_speed < 0)) {
            // When the user releases the 'up' key, instantly stop the jump. This
            // allows Clank to make small jumps when required.
            this.jet_active = false;
            this.y_speed = 0;
        }
        // Apply brakes
        if (!this.moving) {
            if (this.x_speed > 0) {
                this.x_speed = this.x_speed - 0.2;
                if (this.x_speed < 0) {
                    this.x_speed = 0;
                }
            } else if (this.x_speed < 0) {
                this.x_speed = this.x_speed + 0.2;
                if (this.x_speed > 0) {
                    this.x_speed = 0;
                }
            }
        }
    
        // Is there a tile immediately in front of us?
        if (this.game.tiles.collision_to_left(this)) {
            // Bounce back
            this.x = this.x + 2.0;
            // ...and stop
            this.x_speed = 0;
        }
        if (this.game.tiles.collision_to_right(this)) {
            // Bounce back
            this.x = this.x - 2.0;
            // ...and stop
            this.x_speed = 0;
        }
                
        // If we are in the air, but not jumping (i.e. we are descending), check to
        // see if we land on any mobiles and destroy them.
        if (!this.on_platform) {
            collisions = this.game.mob_controller.collision_below(this);
            if (collisions.length > 0) {
                var clank = this;
                var inList = function(item) {
                    var destroyed = false;
                    if (collisions.indexOf(item, 0) > -1) {
                        destroyed = clank.on_collision(item);
                    }
                    return destroyed;
                };
                this.game.mob_controller.removeIf(inList);
            }
        }
        
        // Move the sprite
        if (this.x >= 0) {
            // Move
            this.move(this.x_speed);
            if ((this.y_speed < 0) && (this.y > 80)) {
                // Apply upward thrust
                this.move(0, this.y_speed);
            } 
            else
            {
                // Apply gravity
                if (!this.on_platform) {
                    this.y = this.y + this.y_speed;
                    if (this.y_speed < this.max_y) {
                        this.y_speed = this.y_speed + this.gravity;
                    }
                }
            }
        }
        if (this.y_speed < 0) {
            this.y_speed = this.y_speed + 0.4;
            if (this.y_speed > 0) {
                this.y_speed = 0;
            }
        }
        if (this.x < 0) {
            this.x = 0;
            this.x_speed = 0;
        }
    
        // Check for any other collisions
        var damaged = false;
        collisions = this.game.mob_controller.collideOneWithMany(this);
        if (collisions.length > 0) {
            var clank = this;
            collisions.forEach( function(item, total) {
                damaged = item.on_collision(clank);
            });
        }
        collisions = this.game.fixture_controller.collideOneWithMany(this);
        if (collisions.length > 0) {
            var clank = this;
            collisions.forEach( function(item, total) {
                damaged = damaged || item.on_collision(clank);
            });
            var inList = function(item) {
                var destroyed = false;
                if (collisions.indexOf(item, 0) > -1) {
                    destroyed = clank.on_collision(item);
                }
                return destroyed;
            };
            this.game.fixture_controller.removeIf(inList);
        }
        if(damaged) {
            // Start the 'safe from damage' timer
            this.safety_countdown.reset(this.safety_time);
            this.damage_anim.index = 0;
        }
        // jaws.log(this.x + ", " + this.y + " : " + this.x_speed + ", " + this.jet);
    }
    // Update the Energy Indicator
    this.energy_indicator.update();
}

// -----------------------------------------------------------------------------
// draw()
// -----------------------------------------------------------------------------
// Draws Clank and any associated images (such as the Damage Indicator).
Clank.prototype.draw = function() {
    if (this.active) {
        if (!this.safety_countdown.expired) {
            this.setImage(this.damage_anim.next());
            Mobile.prototype.draw.call(this);
            this.setImage(this.anim.currentFrame());
        }        
        // Call the inherited draw() method to do the standard drawing.
        Mobile.prototype.draw.call(this);
    }
};

// -----------------------------------------------------------------------------
// apply_damage()
// -----------------------------------------------------------------------------
Clank.prototype.apply_damage = function(amount) {
    if ((this.safety_countdown.expired) || (amount < 0)) {
        Mobile.prototype.apply_damage.call(this, amount);
    }
}
//}}}

/*
 * =============================================================================
 * Storm - the stormy sky background
 * =============================================================================
 */
//{{{ 
function Storm() {
    this.setup = function() {
        this.clouds = new jaws.Parallax({repeat_x: true})
        this.clouds.addLayer({image: "graphics/dark_clouds_01.png", damping: 50})
        this.clouds.addLayer({image: "graphics/dark_clouds_02.png", damping:  10})
        
        this.rain = new jaws.Parallax({repeat_x: true, repeat_y: true})
        this.rain.addLayer({image: "graphics/rain_01.png", damping: 1})
        
        this.clouds.draw()
        this.rain.draw()
    }
    this.update = function() {
        this.clouds.camera_x += 4
        this.rain.camera_x += 2;
        this.rain.camera_y -= 2;
    }
    this.draw = function() {
        this.clouds.draw()
        this.rain.draw()
    }
}
//}}}

/*
 * =============================================================================
 * Tile (jaws.Sprite) - handles a single tile
 * =============================================================================
 */
//{{{ 
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
    // Keep note of the starting position
    this.start_x = options.x;
    this.start_y = options.y;
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
Tile.prototype.update = function() {
    
}
//}}}

/*
 * =============================================================================
 * Tiles - handles the tiles that make up a single 'scene'
 * =============================================================================
 */
 
//{{{ 
function Tiles() {
    'use strict';
    this.setup = function(game) {
        this.game = game;
        this.tilemap = new jaws.TileMap({size: [this.game.cells_x, this.game.cells_y], cell_size: [this.game.cell_size, this.game.cell_size]});
        this.back_tilemap = new jaws.TileMap({size: [this.game.cells_x / 2, this.game.cells_y / 2], cell_size: [this.game.cell_size * 2, this.game.cell_size * 2]});
    };
    this.load = function(level) {
        var imagefile;
        var i;
        var j;

        this.tiles = LevelTiles(level);
        this.tilemap.push(this.tiles);
        
        this.back_tiles = LevelBackdrop(level);
        this.back_tilemap.push(this.back_tiles);
    }
    this.atRect = function(rect) {
        var all_tiles;
        var sprite_tiles = []
        all_tiles = this.tilemap.atRect(rect);
        all_tiles.forEach(function(item, total) {
                if(item) { sprite_tiles.push(item); };
        });
        return sprite_tiles;
    };
    this.clear = function() {
        this.tilemap.clear();
        this.back_tilemap.clear();
    }
    /*
        collision-to-left
        
        Take the top and bottom co-ordinates of the left edge of the mobile. Offset
        these one pixel to the left. Now use Math.floor() to calculate the cells
        that these positions refer to. If there is a tile in either cell, return
        True, otherwise return False.
     */
    this.collision_to_left = function(mobile) {
        var top = [mobile.rect().x - 1, mobile.rect().y];
        var bottom = [mobile.rect().x - 1, mobile.rect().y + mobile.height - 1];
        var cell_top = [Math.floor(top[0] / this.game.cell_size), Math.floor(top[1] / this.game.cell_size)]
        var cell_bottom = [Math.floor(bottom[0] / this.game.cell_size), Math.floor(bottom[1] / this.game.cell_size)]
        var cell;
        var found = false;
        if (cell_top[0] > -1) {
            cell = this.tilemap.cell(cell_top[0], cell_top[1]);
            if ((cell) && (cell[0]) && (cell[0].type == 1)) {
                found = true;
            }
        }
        if ((!found) && (cell_bottom[0] > -1)) {
            cell = this.tilemap.cell(cell_bottom[0], cell_bottom[1]);
            if ((cell) && (cell[0]) && (cell[0].type == 1)) {
                found = true;
            }
        }
        return found;
    };
    
    /*
        collision-to-right
        
        Take the top and bottom co-ordinates of the right edge of the mobile. Offset
        these one pixel to the right. Now use Math.floor() to calculate the cells
        that these positions refer to. If there is a tile in either cell, return
        True, otherwise return False.
     */
    this.collision_to_right = function(mobile) {
        var top = [mobile.rect().right + 1, mobile.rect().y];
        var bottom = [mobile.rect().right + 1, mobile.rect().y + mobile.height - 1];
        var cell_top = [Math.floor(top[0] / this.game.cell_size), Math.floor(top[1] / this.game.cell_size)]
        var cell_bottom = [Math.floor(bottom[0] / this.game.cell_size), Math.floor(bottom[1] / this.game.cell_size)]
        var cell;
        var found = false;
        if (cell_top[0] < this.game.cells_x) {
            cell = this.tilemap.cell(cell_top[0], cell_top[1]);
            if ((cell) && (cell[0]) && (cell[0].type == 1)) {
                found = true;
            }
        }
        if ((!found) && (cell_bottom[0] < this.game.cells_x)) {
            cell = this.tilemap.cell(cell_bottom[0], cell_bottom[1]);
            if ((cell) && (cell[0]) && (cell[0].type == 1)) {
                found = true;
            }
        }
        return found;
    };
    
    /*
        collision-below
    
        Take the left and right co-ordinates of the bottom edge of the mobile.
        Offset these one pixel downwards. Now use Math.floor() to calculate the
        cells that these positions refer to. If there is a tile in either cell,
        Return True, otherwise return False.
     */
    this.collision_below = function(mobile) {
        var left = [mobile.rect().x, mobile.height + mobile.rect().y];
        var right = [mobile.rect().right, mobile.height + mobile.rect().y];
        var cell_left = [Math.floor(left[0] / this.game.cell_size), Math.floor(left[1] / this.game.cell_size)]
        var cell_right = [Math.floor(right[0] / this.game.cell_size), Math.floor(right[1] / this.game.cell_size)]
        var cell;
        var found = false;
        if (cell_left[1] < this.game.cells_y) {
            cell = this.tilemap.cell(cell_left[0], cell_left[1]);
            if ((cell) && (cell[0])) {
                found = true;
                mobile.y = cell[0].y - mobile.height;
            }
        }
        if ((!found) && (cell_right[1] < this.game.cells_y)) {
            cell = this.tilemap.cell(cell_right[0], cell_right[1]);
            if ((cell) && (cell[0])) {
                found = true;
                mobile.y = cell[0].y - mobile.height;
            }
        }
        return found;
    };
}
//}}}

/*
 * =============================================================================
 * MobilePlatform (Mobile) - a moving platform
 * =============================================================================
 */
//{{{ 
// -----------------------------------------------------------------------------
// Constructor
// -----------------------------------------------------------------------------
var MobilePlatform = function(options) {
    'use strict';
    // Call the inherited constructor.
    this.constructor(options);
};

// -----------------------------------------------------------------------------
// prototype
// -----------------------------------------------------------------------------
// Set up prototype to enable inheritance from Sprite (TODO: inherit from Mobile)
MobilePlatform.prototype = (function() {
    'use strict';
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = Mobile.prototype;
    return new inherited;
})();

// -----------------------------------------------------------------------------
// setup()
// -----------------------------------------------------------------------------
MobilePlatform.prototype.setup = function() {
    'use strict';
    // Create the animation
    this.anim = new jaws.Animation({sprite_sheet: this.options.image, frame_size: [80, 80], loop: true, frame_duration: 100})
    this.setImage(this.anim.currentFrame());
    // Set the initial direction and speed
    this.x_speed = this.options.x_speed || 0;
    this.y_speed = this.options.y_speed || 0;
    // Set the range that the platform moves within
    this.range_left   = this.options.cell_range[0] * this.game.cell_size;
    this.range_top    = this.options.cell_range[1] * this.game.cell_size;
    this.range_right  = (this.options.cell_range[2] * this.game.cell_size) + this.rect().width;
    this.range_bottom = (this.options.cell_range[3] * this.game.cell_size) + this.rect().height;
    // Set the start position
    this.start_x = this.options.cell_x * this.game.cell_size;
    this.start_y = this.options.cell_y * this.game.cell_size;
    this.x = this.start_x;
    this.y = this.start_y;
    // Default the platform to off
    this.is_operating = false;
};

// -----------------------------------------------------------------------------
// update()
// -----------------------------------------------------------------------------
MobilePlatform.prototype.update = function() {
    'use strict';
    if (this.is_operating) {
        this.setImage(this.anim.next());
        if (this.y_speed != 0) {
            this.y = this.y + this.y_speed;
            if (this.y < this.range_top) {
                this.y_speed = -this.y_speed;
            } else if ((this.y + this.rect().height) > this.range_bottom) {
                this.y = this.start_y;
                this.y_speed = -this.y_speed;
            }
        }
        if (this.x_speed != 0) {
            this.x = this.x + this.x_speed;
            if (this.x < this.range_left) {
                this.x_speed = -this.x_speed;
            } else if ((this.x + this.rect().width) > this.range_right) {
                this.x = this.start_x;
                this.x_speed = -this.x_speed;
            }
        }
    }
};

// -----------------------------------------------------------------------------
// start()
// -----------------------------------------------------------------------------
// Starts the platform
MobilePlatform.prototype.start = function() {
    this.is_operating = true;
}

// -----------------------------------------------------------------------------
// stop()
// -----------------------------------------------------------------------------
// Stops the platform
MobilePlatform.prototype.stop = function() {
    this.is_operating = false;
}
//}}}

/*
 * =============================================================================
 * PlatformController (jaws.SpriteList) - handler for a set of platforms
 * =============================================================================
 */
//{{{ 
// -----------------------------------------------------------------------------
// Constructor
// -----------------------------------------------------------------------------
PlatformController = function(options, game) {
    'use strict';
    // Call the inherited constructor.
    this.constructor(options);
    // Keep a reference to the game context
    this.game = game;
    // Platforms to default to off
    this.is_operating = false;
};

// -----------------------------------------------------------------------------
// prototype
// -----------------------------------------------------------------------------
// Set up prototype to enable inheritance from SpriteList
PlatformController.prototype = (function() {
    'use strict';
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = jaws.SpriteList.prototype;
    return new inherited;
})();

// -----------------------------------------------------------------------------
// add()
// -----------------------------------------------------------------------------
// Adds a new platform, based on the supplied options
PlatformController.prototype.add = function(options) {
    'use strict';
    var platform = new MobilePlatform(options);
    platform.init(this.game);
    this.push(platform);
};

// -----------------------------------------------------------------------------
// clear()
// -----------------------------------------------------------------------------
// Deletes all platforms
PlatformController.prototype.clear = function() {
    'use strict';
    // this.deleteIf( function(item) { return true; } );
    this.sprites = [];
}

// -----------------------------------------------------------------------------
// collision_below()
// -----------------------------------------------------------------------------
// Checks whether the given mobile (usually Clank) collides with the top of
// any of the platforms in this group, and returns the last such platform.
PlatformController.prototype.collision_below = function(mobile) {
    'use strict';
    var result = null;
    this.forEach(function(item, total) {
            if(item) { 
                if (item.collision_below(mobile)) {
                    result = item;
                }
            };
    });
    return result;
};

// -----------------------------------------------------------------------------
// start()
// -----------------------------------------------------------------------------
// Starts all the platforms
PlatformController.prototype.start = function() {
    this.sprites.forEach( function(item, total) { item.start(); } );
    this.is_operating = true;
}

// -----------------------------------------------------------------------------
// stop()
// -----------------------------------------------------------------------------
// Stops all the platforms
PlatformController.prototype.stop = function() {
    this.sprites.forEach( function(item, total) { item.stop(); } );
    this.is_operating = false;
}
//}}}

/*
 * =============================================================================
 * class FactoryController - base class to maintain collections of other objects
 * =============================================================================
//{{{ 
 * This is very similar to the jaws.SpriteList class, but there were enough
 * differences that it seemed better to create a new class.
 *
 * Properties:
 *  - objects                    | array of controlled objects
 *
 * Methods:
 *  - FactoryController(options) | constructor
 *  - init(game)                 | initialiser - call, but do not override
 *  - setup()                    | called by init() to do object-specific setup
 *  - clear()                    | removes all the controlled objects
 *  - update()                   | update objects, if active
 *  - draw()                     | draw objects, if active
 *  - collideOneWithMany(mobile) | checks for collisions with the mobile
 *  - removeIf(condition)        | removes objects which match a given condition
 *
//}}}
 */

//{{{ 
// -----------------------------------------------------------------------------
// Constructor
// -----------------------------------------------------------------------------
// For consistency this has the same signature as most of the jaws classes
var FactoryController = function(options) {
    'use strict';
    // Store a reference to the options, for use by other methods
    this.options = options;
};

// -----------------------------------------------------------------------------
// init(game)
// -----------------------------------------------------------------------------
// Initialises the class
FactoryController.prototype.init = function(game) {
    'use strict';
    // Don't allow anything to be updated or drawn while we are still setting
    // up the object.
    this.active = false;
    
    // Keep a reference to the main game context
    this.game = game;

    // Set up an array to hold the list of controlled objects
    this.objects = [];
    
    // Do any object-specific setup
    this.setup();
    
    // Activate the object now.
    this.active = true;
};

// -----------------------------------------------------------------------------
// setup()
// -----------------------------------------------------------------------------
// Sets up the basic class properties. Automatically called by init().
FactoryController.prototype.setup = function() {
    'use strict';
};

// -----------------------------------------------------------------------------
// clear()
// -----------------------------------------------------------------------------
// Removes all the controlled objects, clearing the objects array.
FactoryController.prototype.clear = function() {
    'use strict';
    this.objects.length = 0;
};

// -----------------------------------------------------------------------------
// add(object)
// -----------------------------------------------------------------------------
// Adds new object to the list of controlled objects. The object should be a
// FactoryPart (or descendant) instance, or should at least include update()
// and draw() methods.
FactoryController.prototype.add = function(object) {
    'use strict';
    this.objects.push(object);
};

// -----------------------------------------------------------------------------
// create(object)
// -----------------------------------------------------------------------------
// Creates and adds a new object to the list of controlled objects. The default
// version creates a standard FactoryPart instance, passing it the supplied
// options (note that these options are therefore for the created object, rather
// than the options for the FactoryController itself).
FactoryController.prototype.create = function() {
    'use strict';
    var object = new FactoryPart(options);
    object.init(this.game);
    this.add(object);
};

// -----------------------------------------------------------------------------
// update()
// -----------------------------------------------------------------------------
// Updates all the controlled objects, provided the controller is active.
FactoryController.prototype.update = function() {
    'use strict';
    if (this.active) {
        this.objects.forEach( function(item, total) { item.update(); } );
    }
};

// -----------------------------------------------------------------------------
// draw()
// -----------------------------------------------------------------------------
// Draws all the controlled objects, provided the controller is active, and
// only draws objects which are themselves active.
FactoryController.prototype.draw = function() {
    'use strict';
    if (this.active) {
        var that = this;
        this.objects.forEach( function(item, total) { if (item.active) { that.game.viewport.draw(item); } } );
    }
};

// -----------------------------------------------------------------------------
// collideOneWithMany(mobile)
// -----------------------------------------------------------------------------
// Checks whether the supplied mobile has collided with any of the objects, and
// returns a list of the collisions.
FactoryController.prototype.collideOneWithMany = function(mobile) {
    return jaws.collideOneWithMany(mobile, this.objects);
};

// -----------------------------------------------------------------------------
// removeIf(condition)
// -----------------------------------------------------------------------------
FactoryController.prototype.removeIf = function(condition) {
  this.objects = this.objects.filter(function(ea) {
    return !condition(ea)
  })
}
//}}}

/*
 * =============================================================================
 * class FixtureController - base class to maintain collections of Fixtures
 * =============================================================================
//{{{ 
  *
 * Inherited Properties:
 *  - objects                    | array of controlled objects
 *
 * Methods:
 *  - FactoryController(options) | constructor
 *  - init(game)                 | initialiser - call, but do not override
 *  - setup()                    | called by init() to do object-specific setup
 *  - update()                   | update objects, if active
 *  - draw()                     | draw objects, if active
 *  - collideOneWithMany(mobile) | checks for collisions with the mobile
 *
//}}}
 */
//{{{ 
// -----------------------------------------------------------------------------
// Constructor
// -----------------------------------------------------------------------------
var FixtureController = function(options) {
    'use strict';
    // Store a reference to the options, for use by other methods
    this.options = options;
};

// -----------------------------------------------------------------------------
// prototype
// -----------------------------------------------------------------------------
// Set up the prototype to enable inheritance.
FixtureController.prototype = (function() {
    'use strict';
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = FactoryController.prototype;
    return new inherited;
})();
//}}}

/*
 * =============================================================================
 * Mob - a collection of mobiles
 * =============================================================================
 */
//{{{ 
var Mob = function(options) {
    'use strict';
    // Call the inherited constructor.
    this.constructor(options);
    this.options = options; // jaws.SpriteList does not store the options
};
// Constructor, to enable inheritance.
Mob.prototype = (function() {
    'use strict';
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = jaws.SpriteList.prototype;
    return new inherited;
})();
Mob.prototype.init = function(game) {
    // Keep a reference to the main game context object.
    this.game = game;
    this.setup();
};    
Mob.prototype.setup = function() {
    'use strict';
    // Keep a note of the image filename
    this.imagefile = this.options.image;
    // Where should the Mobiles start from?
    this.start_x = this.options.x;
    this.start_y = this.options.y;
    // What gap should there be between Mobiles?
    this.gap_x = this.options.gap_x || 120;
    this.gap_y = this.options.gap_y || 0;
    // How many mobiles should be created?
    this.max = this.options.max || 3;
    // Keep a record of the last mobile created
    this.last_mobile = null;
};
Mob.prototype.update = function() {
    'use strict';
    jaws.SpriteList.prototype.update.call(this);
    if (this.sprites.length < this.max) {
        if ((this.sprites.length == 0) || (Math.abs(this.last_mobile.x - this.start_x) > this.gap_x)) {
            var mobile = new MobileEnemy(this.options);
            mobile.init(this.game);
            this.push(mobile);
            this.last_mobile = mobile;
        }
    }
};
Mob.prototype.clear = function() {
    'use strict';
    // this.deleteIf( function(item) { return true; } );
    this.sprites = [];
};

Mob.prototype.collision_below = function(mobile) {
    'use strict';
    // Check whether the given mobile (usually Clank) collides with the top of
    // any of the mobiles in this group
    var result = [];
    this.forEach(function(item, total) {
            if(item) { 
                if (item.collision_below(mobile)) {
                    result.push(item);
                }
            };
    });
    return result;
};
//}}}

/*
 * =============================================================================
 * MobController - collection of mobs
 * =============================================================================
 * This shares the same interface as FactoryPart(), even though it does not
 * descend from it (as it is not a visual sprite).
 */
//{{{ 
var MobController = function() {
    'use strict';
    // Array to hold the mobs
    this.mobs = []
};

// -----------------------------------------------------------------------------
// init()
// -----------------------------------------------------------------------------
MobController.prototype.init = function(game) {
    'use strict';
    // Keep a reference to the game
    this.game = game;
};

// -----------------------------------------------------------------------------
// update()
// -----------------------------------------------------------------------------
MobController.prototype.update = function() {
    'use strict';
    // Pass the update handling on to each of the controlled mobs
    this.mobs.forEach( function(item, total) { item.update(); } );
};

// -----------------------------------------------------------------------------
// draw()
// -----------------------------------------------------------------------------
MobController.prototype.draw = function() {
    'use strict';
    // Pass the draw handling on to each of the controlled mobs
    var that = this;
    this.mobs.forEach( function(item, total) { that.game.viewport.draw(item); } );
};

// -----------------------------------------------------------------------------
// add()
// -----------------------------------------------------------------------------
MobController.prototype.add = function(mob) {
    'use strict';
    this.mobs.push(mob);
};

// -----------------------------------------------------------------------------
// clear()
// -----------------------------------------------------------------------------
MobController.prototype.clear = function() {
    this.mobs.forEach( function(item, total) { item.clear(); item = null; } );
    this.mobs = [];
};

// -----------------------------------------------------------------------------
// collision_below()
// -----------------------------------------------------------------------------
MobController.prototype.collision_below = function(mobile) {
    'use strict';
    var collisions = [];
    this.mobs.forEach( function(mob, total) { collisions = collisions.concat(mob.collision_below(mobile)); } );
    return collisions;
};

// -----------------------------------------------------------------------------
// removeIf(list)
// -----------------------------------------------------------------------------
MobController.prototype.removeIf = function(condition) {
    this.mobs.forEach( function(item, total) { item.removeIf(condition); } );
};

// -----------------------------------------------------------------------------
// collideOneWithMany(mobile)
// -----------------------------------------------------------------------------
MobController.prototype.collideOneWithMany = function(mobile) {
    var collisions = [];
    this.mobs.forEach( function(mob, total) { collisions = collisions.concat(jaws.collideOneWithMany(mobile, mob)); } );
    return collisions;
};
//}}}

/*
 * =============================================================================
 * class Door
 * =============================================================================
//{{{ 
  * Controls the entrance and exit doors for each level.
 *
 * Properties:
 *  - anim        | animation (defaults to the Sprite image)
 *  - is_open     | current state of the door
 *  - is_exit     | this is the level exit door 
 *
 * Inherited Properties:
 *  - x           | horizontal position  (0 = furthest left)
 *  - y           | vertical position    (0 = top)
 *  - image       | Image/canvas or string pointing to an asset ("player.png")
 *  - alpha       | transparency 0=fully transparent, 1=no transparency
 *  - angle       | angle in degrees (0-360)
 *  - flipped     | flip sprite horizontally
 *  - anchor      | string stating how to anchor the sprite to canvas
 *  - scale_image | scale the sprite by this factor
 *  - game        | reference to main game context object
 *  - active      | is this part currently active (will it be updated/drawn)?
 *  - hit_points  | how much damage can it sustain (-1 = limitless)
 *  - damage      | how much damage has it sustained?
 *  - destroyed   | has it been destroyed?
 *  - attack      | how much damages does it inflict?
 *
 * Methods:
 *  - Door(options)           | constructor
 *  - open()                  | opens the door
 *  - close()                 | closes the door
 *
 * Inherited Methods:
 *  - init(game)              | initialiser - call, but do not override
 *  - setup()                 | called by init() to do object-specific setup
 *  - update()                | update position, state, etc., if active
 *  - draw()                  | draw, if active
 *  - apply_damage(amount)    | apply damage to this part
 *  - collision_below(mobile) | check if mobile is directly on top of this part
 *  - rect()                  | returns bounding rectangle
 *
//}}}
 */
//{{{ 
// -----------------------------------------------------------------------------
// Constructor
// -----------------------------------------------------------------------------
var Door = function(options) {
    'use strict';
    // Call the inherited constructor.
    this.constructor(options);
};

// -----------------------------------------------------------------------------
// prototype
// -----------------------------------------------------------------------------
// Set up prototype to enable inheritance from FactoryPart
Door.prototype = (function() {
    'use strict';
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = FactoryPart.prototype;
    return new inherited;
})();

// -----------------------------------------------------------------------------
// setup
// -----------------------------------------------------------------------------
// Sets up the door
Door.prototype.setup = function() {
    // Load the animation frames
    this.anim = new jaws.Animation({sprite_sheet: this.options.image, frame_size: [160, 160], loop: false})
    // Set the values
    this.is_exit = this.options.is_exit || false;
    // Set up the collision-rect. Clank will only be assumed to have reached
    // the door when this rect area is reached
    this.collision_rect = new jaws.Rect(this.x + 80, this.y + 40, 40, 80);
    // Set the current state
    this.close();
}

// -----------------------------------------------------------------------------
// reposition
// -----------------------------------------------------------------------------
// Repositions the door at the specified location, and recalculates the
// collision rect.
Door.prototype.reposition = function(x, y) {
    this.x = x;
    this.y = y;
    this.collision_rect.moveTo(this.x + 80, this.y + 40);
}

// -----------------------------------------------------------------------------
// open
// -----------------------------------------------------------------------------
// Displays door as 'open'
Door.prototype.open = function() {
    this.is_open = true;
    this.anim.index = 1;
    this.setImage(this.anim.currentFrame());
}

// -----------------------------------------------------------------------------
// close
// -----------------------------------------------------------------------------
// Displays door as 'closed'
Door.prototype.close = function() {
    this.is_open = false;
    this.anim.index = 0;
    this.setImage(this.anim.currentFrame());
}

// -----------------------------------------------------------------------------
// at_door(mobile)
// -----------------------------------------------------------------------------
// Returns true if the supplied mobile has entered the collision-rect.
Door.prototype.at_door = function(mobile) {
    return jaws.collideRects(this.collision_rect, mobile.rect());
}

/*
 * =============================================================================
 * class Countdown
 * =============================================================================
 * This is a private class used internally by the Timer class (see below), and
 * holds details of a single countdown
 */
var Countdown = function(duration) {
    this.reset(duration);
};

// -----------------------------------------------------------------------------
// reset(duration)
// -----------------------------------------------------------------------------
Countdown.prototype.reset = function(duration) {
    this.duration = duration;
    this.active = true;
    this.expired = false;
    this.last_tick = jaws.game_loop.current_tick;
};

// -----------------------------------------------------------------------------
// update()
// -----------------------------------------------------------------------------
Countdown.prototype.update = function(tick) {
    if ((!this.expired) && (Math.floor((tick - this.last_tick) / 1000) >= 1)) {
        this.last_tick = tick;
        this.duration--;
        if (this.duration <= 0) {
            this.expired = true;
        }
    }
}

// -----------------------------------------------------------------------------
// remove()
// -----------------------------------------------------------------------------
Countdown.prototype.remove = function() {
    this.active = false;
}
//}}}

/*
 * =============================================================================
 * class Timer
 * =============================================================================
//{{{ 
  * Keeps track of the duration of the game and provides a countdown facility.
 *
 * This class has to be slightly tricky because it needs to accommodate the game
 * pausing (when the browser tab loses focus, for example) and to continue the
 * timing correctly when it is unpaused.
 *
 * It also provides a 'counter' facility. Start it using 'start_counter', and
 * then check the 'counter' property to find out how long it has been since the
 * counter was started.
//}}}
 */
//{{{ 
var Timer = function() {
    'use strict';
    this.seconds = 0;
    this.countdowns = [];
};
    
// -----------------------------------------------------------------------------
// setup()
// -----------------------------------------------------------------------------
Timer.prototype.setup = function() {
    'use strict';
    this.seconds = 0;
    this.last_tick = jaws.game_loop.current_tick;
};

// -----------------------------------------------------------------------------
// reset()
// -----------------------------------------------------------------------------
Timer.prototype.reset = function() {
    'use strict';
    // Set the timer to 1 second (starting from 0 seems to cause issues if
    // you attempt to use mod (%) on the seconds)
    this.seconds = 1;
    this.last_tick = jaws.game_loop.current_tick;
};

// -----------------------------------------------------------------------------
// update()
// -----------------------------------------------------------------------------
Timer.prototype.update = function() {
    'use strict';
    var tick = jaws.game_loop.current_tick;
    // Check the difference between the last tick and the current tick. If
    // amounts to 1 second or more, assume that 1 second has passed. This
    // means that if multiple seconds have passed (because the game has been
    // paused), it will still only count as a single second. This is not
    // exactly accurate, but works well enough for the game.
    if (Math.floor((tick - this.last_tick) / 1000) >= 1) {
        this.countdowns.forEach( function(item, total) { item.update(tick); } );
        this.last_tick = tick;
        this.seconds++;
        if (this.counter >= 0) {
            if (Math.floor((tick - this.last_counter_tick) / 1000) >= 1) {
                this.last_counter_tick = tick;
                this.counter++;
            }
        }
    }
    this.countdowns = this.countdowns.filter(function(item) { return (item.active); });
};

// -----------------------------------------------------------------------------
// start_countdown()
// -----------------------------------------------------------------------------
Timer.prototype.start_countdown = function(duration) {
    'use strict';
    var countdown = new Countdown(duration);
    this.countdowns.push(countdown);
    return countdown;
};

// Starts a counter, taking the current second as 0 and counting up each
// second.
Timer.prototype.start_counter = function() {
    this.counter = 0;
    this.last_counter_tick = jaws.game_loop.current_tick;
}

// Stops the counter.
Timer.prototype.stop_counter = function() {
    this.counter = -1;
}

// Returns True if the counter is active.
Timer.prototype.active = function() {
    return (this.counter != -1);
}
//}}}

/*
 * =============================================================================
 * class Dialog - displays messages to the user
 * =============================================================================
//{{{ 
  * The Dialog is a graphic which descends from the top of the screen,
 * and retreats back up out of sight once it has been acknowledged.
//}}}
 */
//{{{ 
// -----------------------------------------------------------------------------
// Constructor
// -----------------------------------------------------------------------------
var Dialog = function(options) {
    'use strict';
    // Call the inherited constructor.
    this.constructor(options);
};

// -----------------------------------------------------------------------------
// prototype
// -----------------------------------------------------------------------------
// Set up prototype to enable inheritance from Sprite (TODO: inherit from Mobile)
Dialog.prototype = (function() {
    'use strict';
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = Mobile.prototype;
    return new inherited;
})();

// -----------------------------------------------------------------------------
// setup()
// -----------------------------------------------------------------------------
Dialog.prototype.setup = function() {
    'use strict';
    // Store the available dialog images
    this.dialogs = [];
    this.dialogs.push("graphics/dialog_00.png");
    this.dialogs.push("graphics/dialog_01.png");
    this.dialogs.push("graphics/dialog_02.png");
    this.dialogs.push("graphics/dialog_03.png");
    this.dialogs.push("graphics/dialog_04.png");
    this.dialogs.push("graphics/dialog_05.png");
    this.dialogs.push("graphics/dialog_06.png");
    this.dialogs.push("graphics/dialog_07.png");
    this.dialogs.push("graphics/dialog_08.png");
    // Set the initial direction, speed, and offscreen-location
    this.x_speed = 0;
    this.y_speed = 0;
    this.x       = 40;
    this.y       = -180;
    // Set the state.
    this.state = DLG_STATE.INACTIVE;
};

// -----------------------------------------------------------------------------
// update()
// -----------------------------------------------------------------------------
Dialog.prototype.update = function() {
    'use strict';
    if (this.state == DLG_STATE.OPENING) {
        if (this.y < 0) {
            this.y = this.y + this.y_speed;
        } else {
            // The dialog is in position
            this.y_speed = 0;
            this.state = DLG_STATE.ACTIVE;
        }
    } else if (this.state == DLG_STATE.CLOSING) {
        if (this.y > -180) {
            this.y = this.y + this.y_speed;
        } else {
            // The dialog is now off-screen
            this.y_speed = 0;
            this.state = DLG_STATE.INACTIVE;
        }
    }
};

// -----------------------------------------------------------------------------
// show(dialog_number)
// -----------------------------------------------------------------------------
Dialog.prototype.show = function(dialog_number) {
    this.setImage(this.dialogs[dialog_number]);
    this.state = DLG_STATE.OPENING;
    this.y_speed = 10;
}

// -----------------------------------------------------------------------------
// hide()
// -----------------------------------------------------------------------------
// Starts the dialog sliding off-screen. If the 'instant' parameter is true,
// it instead moves the dialog off-screen immediately.
Dialog.prototype.hide = function(instant) {
    if (!instant) {
        this.state = DLG_STATE.CLOSING;
        this.y_speed = -10;
    } else {
        this.y = -180;
        this.y_speed = 0;
        this.state = DLG_STATE.INACTIVE;
    }
}
//}}}

/*
 * =============================================================================
 * class GameLevel - base class for handling one level of the game
 * =============================================================================
 */
//{{{ 
var GameLevel = function(options) {
    'use strict';

    // Save a reference to the options, for use by other methods
    this.options = options;
};

// -----------------------------------------------------------------------------
// init(game)
// -----------------------------------------------------------------------------
GameLevel.prototype.init = function(game) {
    // Prevent any actions from happening until we are fully initialised
    this.active = false;
    this.state = LVL_STATE.SETUP;
    
    // Save a reference to the game context
    this.game = game;
    
    // Do the main set-up
    this.setup();
    
    // Activate the level
    this.active = true;
};

// -----------------------------------------------------------------------------
// setup()
// -----------------------------------------------------------------------------
// Loads/creates and sets up all the assets for the level
GameLevel.prototype.setup = function() {
    'use strict';
};

// -----------------------------------------------------------------------------
// clear()
// -----------------------------------------------------------------------------
// Clears the level elements, for when we are changing from one level to
// another. Any descendant classes should call this inherited method, and then
// do any necessary clearing of their own elements.
GameLevel.prototype.clear = function() {
    // Clear any existing items
    this.game.tiles.clear();
    this.game.mob_controller.clear();
    this.game.fixture_controller.clear();
    this.game.platform_controller.stop();
    this.game.platform_controller.clear();
    // Make sure the dialog is not visible
    this.game.dialog.hide(true);
};

// -----------------------------------------------------------------------------
// update()
// -----------------------------------------------------------------------------
GameLevel.prototype.update = function() {
    'use strict';
};

// -----------------------------------------------------------------------------
// draw()
// -----------------------------------------------------------------------------
GameLevel.prototype.draw = function() {
    'use strict';
};
//}}}

/*
 * =============================================================================
 * class Fader - full screen overlay for messages and between-level fades
 * =============================================================================
 */
 
//{{{ 
// -----------------------------------------------------------------------------
// Constructor
// -----------------------------------------------------------------------------
var Fader = function(options) {
    'use strict';
    // Call the inherited constructor.
    this.constructor(options);
};

// -----------------------------------------------------------------------------
// prototype
// -----------------------------------------------------------------------------
// Set up prototype to enable inheritance from Sprite
Fader.prototype = (function() {
    'use strict';
    // Set up the inherited prototype.
    var inherited = function(){ };
    inherited.prototype = jaws.Sprite.prototype;
    return new inherited;
})();

// -----------------------------------------------------------------------------
// init(game)
// -----------------------------------------------------------------------------
Fader.prototype.init = function(game) {
    // Prevent it from automatically displaying
    this.active = false;
    
    // Save a reference to the game context
    this.game = game;
    
    // Do the main set-up
    this.setup();
};

// -----------------------------------------------------------------------------
// setup()
// -----------------------------------------------------------------------------
Fader.prototype.setup = function() {
    this.x = 0;
    this.y = 0;
    this.messages = [
        "graphics/fader_01.png",
        "graphics/fader_02.png",
        "graphics/fader_03.png"
    ];
    this.setImage(this.messages[0]);
}

// -----------------------------------------------------------------------------
// update()
// -----------------------------------------------------------------------------
Fader.prototype.update = function() {
}

// -----------------------------------------------------------------------------
// draw()
// -----------------------------------------------------------------------------
Fader.prototype.draw = function() {
    if (this.active) {
        jaws.Sprite.prototype.draw.call(this);
    }
}

// -----------------------------------------------------------------------------
// show(message_number)
// -----------------------------------------------------------------------------
Fader.prototype.show = function(message_number) {
    this.setImage(this.messages[message_number]);
    this.active = true;
}

// -----------------------------------------------------------------------------
// hide()
// -----------------------------------------------------------------------------
Fader.prototype.hide = function() {
    this.active = false;
}
//}}}

/*
 * =============================================================================
 * class IntroLevel
 * =============================================================================
 */
//{{{ 
var IntroLevel = function() { 
    'use strict';
};

// -----------------------------------------------------------------------------
// prototype
// -----------------------------------------------------------------------------
// Set up prototype to enable inheritance from jaws.Sprite
IntroLevel.prototype = function() {
    'use strict';
    
    // Create a new, empty object
    var inherited = function() { };
    
    // Copy the 'GameLevel' prototype to it
    inherited.prototype = GameLevel.prototype;
    
    // Return a new copy of the object
    return new inherited();
}();

// -----------------------------------------------------------------------------
// setup()
// -----------------------------------------------------------------------------
// Creates and initialises the IntroLevel elements. Called automatically by the
// Game class.    
IntroLevel.prototype.setup = function() {
    'use strict';
    this.game.clank.active = false;
    this.game.entry_door.active = false;
    this.game.exit_door.active = false;
    
    this.lightning_bolts = [
        new jaws.Sprite({image: "graphics/lightning_01.png", x: 0, y: 0}),
        new jaws.Sprite({image: "graphics/lightning_02.png", x: 0, y: 0})
    ]
    this.lightning_bolt = -1;
    this.flash = false;
    this.flash_countdown = this.game.timer.start_countdown(3);

    this.intro_texts = [
        new jaws.Sprite({image: "graphics/intro_01.png", x: 0, y: 0}),
        new jaws.Sprite({image: "graphics/intro_02.png", x: 0, y: 0}),
        new jaws.Sprite({image: "graphics/title.png", x: 0, y: 0})
    ];
    this.intro_text = -1;
    this.advance_text = true;
    this.text_countdown = this.game.timer.start_countdown(4);
    
    // Reset the timer
    this.game.timer.reset();
};

// -----------------------------------------------------------------------------
// clear()
// -----------------------------------------------------------------------------
IntroLevel.prototype.clear = function() {
    // Call the inherited method
    GameLevel.prototype.clear.call(this);
    // Do our own clear-up
    this.lightning_bolts.length = 0;
};

// -----------------------------------------------------------------------------
// update()
// -----------------------------------------------------------------------------
// Updates the IntroLevel animation. Called automatically by the Game class.
// Switches to the main game when the user presses the Enter key
IntroLevel.prototype.update = function() {
    'use strict';
    var introlevel = this;
    if (jaws.pressed("enter")) {
        this.game.next_level(1);
    }
    if (this.flash_countdown.expired) {
        this.flash = !this.flash;
        if (this.flash) {
            this.flash_countdown.reset(1);
            this.lightning_bolt++;
            if (this.lightning_bolt > 1) { 
                this.lightning_bolt = 0; 
            }
        } else {
            this.flash_countdown.reset(4);
        }
    }
    if (this.text_countdown.expired) {
        this.intro_text++;
        if (this.intro_text > 2) {
            this.intro_text = 2;
        }
        this.text_countdown.reset(6);
    }
};

// -----------------------------------------------------------------------------
// draw()
// -----------------------------------------------------------------------------
// Draws the IntroLevel elements. Called automatically by the Game class.    
IntroLevel.prototype.draw = function() {
    'use strict';
    if (this.flash) {
        this.lightning_bolts[this.lightning_bolt].draw();
    }
    if (this.intro_text >= 0) {
        this.intro_texts[this.intro_text].draw();
    }
};
//}}}

/*
 * =============================================================================
 * TestLevel
 * =============================================================================
 */

//{{{ 
var TestLevel = function() { 
    'use strict';
};

// -----------------------------------------------------------------------------
// prototype
// -----------------------------------------------------------------------------
// Set up prototype to enable inheritance from GameLevel
TestLevel.prototype = function() {
    'use strict';
    
    // Create a new, empty object
    var inherited = function() { };
    
    // Copy the 'GameLevel' prototype to it
    inherited.prototype = GameLevel.prototype;
    
    // Return a new copy of the object
    return new inherited();
}();

TestLevel.prototype.setup = function() {

    // Load the level
    this.game.tiles.load(1);
    
    this.dialog_number = 0;
    
    var options = {image: "graphics/platform_01.png", cell_range: [30, 11, 30, 18], cell_x: 30, cell_y: 18, x_speed: 0, y_speed: -1.0};      
    this.game.platform_controller.add(options);
    
    this.game.entry_door.active = true;
    this.game.exit_door.active = true
    
    this.game.clank.x = this.game.entry_door.x + 60;
    this.game.clank.y = this.game.max_y - (3 * this.game.cell_size);
    this.game.clank.anim = this.game.clank.entering_anim;
    this.game.clank.active = false;

    this.switch = new Switch({image: "graphics/switch_01.png", frame_size: [40, 40], x: 160, y: this.game.max_y - (this.game.cell_size * 2)});
    this.switch.init(this.game);
    
    this.game.fixture_controller.add(this.switch);

    options.image = "graphics/battery_01.png";
    options.frame_size = [40, 40];
    options.x = (20 * this.game.cell_size);
    options.y = this.game.max_y - (2 * this.game.cell_size);
    battery = new Battery(options);
    battery.init(this.game);
    this.game.fixture_controller.add(battery);
    
    /*
    this.game.mob_controller.add(
        {
            image: "graphics/gear_02.png", 
            frame_size: [40, 40],
            x: 13 * (this.game.cell_size) - 2, 
            y: this.game.max_y - (this.game.cell_size * 1) - 1,
            max: 3,
            hit_points: 1
        }
    );
    
    this.game.mob_controller.add(
        {
            image: "graphics/train_01b.png",
            left_anim: "graphics/train_01b.png",
            right_anim: "graphics/train_01a.png",
            frame_size: [160, 40],
            x: 1600,
            y: this.game.max_y - (this.game.cell_size * 1) - 1,
            max: 1,
            gravity: 0
        }
    );
    */

    var mob = new Mob(
        {
            image: "graphics/soldier_01b.png",
            left_anim: "graphics/soldier_01b.png",
            right_anim: "graphics/soldier_01a.png",
            frame_size: [40, 80],
            frame_duration: 200,
            x: 720,
            y: this.game.max_y - (this.game.cell_size * 2) - 1,
            x_speed: -1,
            max: 1
        }
    );
    mob.init(this.game);
    
    this.game.mob_controller.add(mob);
    
    options =
        {
            image: "graphics/steam_01.png",
            frame_size: [40, 80],
            x: 25 * 40,
            y: 16 * 40,
            delay: 1,
            duration: 1,
            interval: 2
        };

    /*
    jet = new SteamJet(options);
    jet.init(this.game);
    this.game.fixture_controller.add(jet);
    
    options.delay = 2;
    options.x = 28 *40;

    jet = new SteamJet(options);
    jet.init(this.game);
    this.game.fixture_controller.add(jet);
    
    options.delay = 3;
    options.x = 29 *40;

    jet = new SteamJet(options);
    jet.init(this.game);
    this.game.fixture_controller.add(jet);
    
    options.delay = 4;
    options.x = 32 *40;

    jet = new SteamJet(options);
    jet.init(this.game);
    this.game.fixture_controller.add(jet);
    */
    
    // Allow a couple of seconds pause before the level starts running
    this.countdown = this.game.timer.start_countdown(2);
}

TestLevel.prototype.clear = function() {
    // Call the inherited method
    GameLevel.prototype.clear.call(this);
    // Do our own clear-up
}

TestLevel.prototype.update = function() {
    if ((this.game.state == LVL_STATE.ENTERING) && (this.game.dialog.state == DLG_STATE.INACTIVE)) {
        this.game.dialog.show(this.dialog_number);
        this.dialog_number = 1;
    }
    // Level-start (state = 1) - Open the door when the user closes the dialog
    if ((this.game.state == LVL_STATE.ENTERING) && (this.game.dialog.state == DLG_STATE.CLOSING)) {
        this.game.entry_door.open();
        this.game.clank.active = true;
        this.game.clank.anim.index = 0;
        this.game.state = LVL_STATE.ACTIVE;
        // Restart the counter
        this.game.timer.start_counter();
    }
    // Level-active (state = 2) - if the door is still open from the 
    // level-start, close it after another second
    if ((this.game.state == LVL_STATE.ACTIVE) && (this.game.entry_door.is_open)) {
        if (this.game.timer.counter >= 1) {
            this.game.entry_door.close();
            this.game.timer.stop_counter();
            this.game.dialog.show(this.dialog_number);
            this.dialog_number = 2;
        }
    }
    // Level-active (state = 2) - when the user closes the first dialog
    if ((this.game.state == LVL_STATE.ACTIVE) && (this.game.dialog.state == DLG_STATE.INACTIVE)) {
        if (this.dialog_number == 2) {
            this.game.dialog.show(this.dialog_number);
        }
    }

    if ((this.game.state == LVL_STATE.ACTIVE) && (this.game.exit_door.at_door(this.game.clank))) {
        // Clank has reached the exit door. Start the exit procedure.
        this.game.exit_door.open();
        this.clank.x = this.game.exit_door.x + 100;
        this.countdown.reset(2);
        this.game.state = LVL_STATE.LEAVING;
    }
    
    if ((this.game.state == LVL_STATE.LEAVING) && (this.countdown.expired)) {
        // Go to the next level
        this.game.exit_door.close();
        this.active = false;
        this.game.next_level(1);
    }
}

TestLevel.prototype.draw = function() {
}
//}}}

/*
 * =============================================================================
 * Level_1
 * =============================================================================
 */
//{{{ 
var Level_1 = function() { 
    'use strict';
};

// -----------------------------------------------------------------------------
// prototype
// -----------------------------------------------------------------------------
// Set up prototype to enable inheritance from GameLevel
Level_1.prototype = function() {
    'use strict';
    
    // Create a new, empty object
    var inherited = function() { };
    
    // Copy the 'GameLevel' prototype to it
    inherited.prototype = GameLevel.prototype;
    
    // Return a new copy of the object
    return new inherited();
}();

// -----------------------------------------------------------------------------
// setup()
// -----------------------------------------------------------------------------
// Set up the level, creating and initialising the level-specific elements
Level_1.prototype.setup = function() {
    var options;
    var mob;
    
    // Load the level
    this.game.tiles.load(1);

    // Set up the entry and exit doors and re-position them    
    this.game.entry_door.active = true;
    this.game.entry_door.x = (1 * this.game.cell_size);
    this.game.entry_door.y = this.game.max_y - ((1 * this.game.cell_size) + 160);

    this.game.exit_door.active = true
    this.game.exit_door.x = this.game.max_x - (7 * this.game.cell_size);
    this.game.exit_door.y = this.game.max_y - ((8 * this.game.cell_size) + 160);
    
    // Position Clank at the entry door
    this.game.clank.x = this.game.entry_door.x + (this.game.cell_size + 20);
    this.game.clank.y = this.game.entry_door.y + (this.game.cell_size + 40);
    this.game.clank.anim = this.game.clank.entering_anim;
    this.game.clank.active = false;

    // Prepare the dialog
    this.dialog_number = 0;
    
    // Create fixtures
    this.platform_switch = new Switch({image: "graphics/switch_01.png", frame_size: [40, 40], x: (28 * this.game.cell_size), y: this.game.max_y - (this.game.cell_size * 2)});
    this.platform_switch.init(this.game);
    
    this.game.fixture_controller.add(this.platform_switch);

    battery = new Battery(
        {
            image: "graphics/battery_01.png",
            frame_size: [40, 40],
            x: (20 * this.game.cell_size),
            y: this.game.max_y - (2 * this.game.cell_size)
        }
    );
    battery.init(this.game);
    this.game.fixture_controller.add(battery);

    // Create mobiles
    mob = new Mob(
        {
            image: "graphics/soldier_01b.png",
            left_anim: "graphics/soldier_01b.png",
            right_anim: "graphics/soldier_01a.png",
            frame_size: [40, 80],
            frame_duration: 200,
            x: this.game.exit_door.x, 
            y: this.game.exit_door.y,
            x_speed: -1,
            max: 1,
            range: [this.game.exit_door.x - 40, this.game.exit_door.y + 159, this.game.exit_door.x + this.game.exit_door.width + 40, this.game.exit_door.y + 159]
        }
    );
    mob.init(this.game);
    this.game.mob_controller.add(mob);
    
    mob = new Mob(
        {
            image: "graphics/soldier_01b.png",
            left_anim: "graphics/soldier_01b.png",
            right_anim: "graphics/soldier_01a.png",
            frame_size: [40, 80],
            frame_duration: 200,
            x: this.game.max_x - 120, 
            y: this.game.max_y - (3 * this.game.cell_size),
            x_speed: -1,
            max: 1,
        }
    );
    mob.init(this.game);
    this.game.mob_controller.add(mob);

    // Create platforms
    options = {image: "graphics/platform_01.png", cell_range: [30, 11, 30, 18], cell_x: 30, cell_y: 18, x_speed: 0, y_speed: -1.0};      
    this.game.platform_controller.add(options);
    
    this.game.dialog.show(this.dialog_number);
    this.dialog_number = 1;
    
    // In case players are slow to close the initial dialog, close it 
    // automatically after 10 seconds
    this.countdown = this.game.timer.start_countdown(10);
}

// -----------------------------------------------------------------------------
// clear()
// -----------------------------------------------------------------------------
// Remove the level-specific elements. Most of this is handled automatically by
// the Game class, provided the main Controller classes are used to contain the
// elements. Any elements created by the Level itself must be cleared here.
Level_1.prototype.clear = function() {
    // Call the inherited method
    GameLevel.prototype.clear.call(this);
    // Do our own clear-up
    this.platform_switch = null;    
}

// -----------------------------------------------------------------------------
// update()
// -----------------------------------------------------------------------------
// Updates the level-specific elements. Elements which are handled by the main
// Controller classes will be automatically handled by the Game class.
Level_1.prototype.update = function() {
    if ((this.game.state == LVL_STATE.ENTERING) && (this.game.dialog.state == DLG_STATE.ACTIVE) && (this.countdown.expired)) {
        this.game.entry_door.open();
        this.game.clank.active = true;
        this.game.clank.anim.index = 0;
        this.game.state = LVL_STATE.ACTIVE;
        this.game.dialog.show(this.dialog_number); // 'How to move' instructions
        this.dialog_number = 2;
        this.countdown.reset(2);
    }
    
    if ((this.game.state == LVL_STATE.ENTERING) && (this.game.dialog.state == DLG_STATE.INACTIVE)) {
        this.game.entry_door.open();
        this.game.clank.active = true;
        this.game.clank.anim.index = 0;
        this.game.state = LVL_STATE.ACTIVE;
        this.game.dialog.show(this.dialog_number); // 'How to move' instructions
        this.dialog_number = 2;
        this.countdown.reset(2);
    }

    // Once the level is active, close the entry door    
    if ((this.game.state == LVL_STATE.ACTIVE) && (this.game.entry_door.is_open) && (this.countdown.expired)) {
        this.game.entry_door.close();
    }

    // Approaching the blocks -- display the 'jump' instructions
    if ((this.game.clank.x > (8 * this.game.cell_size)) && (this.dialog_number == 2)) {
        this.game.dialog.hide(true);
        this.game.dialog.show(this.dialog_number); // 'How to jump' instructions
        this.dialog_number = 3;
    }

    // On the blocks -- display the warning
    if ((this.game.clank.x > (12 * this.game.cell_size)) && (this.dialog_number == 3)) {
        this.game.dialog.hide(true);
        this.game.dialog.show(this.dialog_number); // 'Throw switch' instructions
        this.dialog_number = 4;
    }
    
    // Approaching the battery -- display the 'battery' message
    if ((this.game.clank.x > (16 * this.game.cell_size)) && (this.dialog_number == 4)) {
        this.game.dialog.hide(true);
        this.game.dialog.show(this.dialog_number); // 'Throw switch' instructions
        this.dialog_number = 5;
    }
    
    // Approaching the switch -- display the 'switch' instructions
    if ((this.game.clank.x > (24 * this.game.cell_size)) && (this.dialog_number == 5)) {
        this.game.dialog.hide(true);
        this.game.dialog.show(this.dialog_number); // 'Throw switch' instructions
        this.dialog_number = 6;
    }
    
    // Switch is thrown -- display the 'platform' instructions
    if ((this.platform_switch.is_on) && (this.dialog_number == 6)) {
        this.game.dialog.hide(true);
        this.game.dialog.show(this.dialog_number);
        this.dialog_number = 7;
    }
    
    // Near the top of the platform -- display the 'exit door' message
    if ((this.game.clank.x > (29 * this.game.cell_size)) && (this.game.clank.y < (800 - (8 * this.game.cell_size))) && (this.dialog_number == 7)) {
        this.game.dialog.hide(true);
        this.game.dialog.show(this.dialog_number);
        this.dialog_number = 8;
    }
        
    this.game.dialog.update();
    
    if ((this.game.state == LVL_STATE.ACTIVE) && (this.game.exit_door.at_door(this.game.clank))) {
        // Clank has reached the exit door. Start the exit procedure.
        this.game.exit_door.open();
        this.game.clank.x = this.game.exit_door.x + 60;
        this.game.clank.y = this.game.exit_door.y + 80;
        this.countdown.reset(2);
        this.game.state = LVL_STATE.LEAVING;
    }
    
    if ((this.game.state == LVL_STATE.LEAVING) && (this.countdown.expired)) {
        // Go to the next level
        this.game.exit_door.close();
        this.active = false;
        this.game.next_level(2);
    }
    
    // Check the platform switch
    if ((this.game.state == LVL_STATE.ACTIVE) && (!this.game.platform_controller.is_operating)) {
        if (this.platform_switch.is_on) {
            this.game.platform_controller.start();
        }
    }
}

// -----------------------------------------------------------------------------
// draw()
// -----------------------------------------------------------------------------
// Called by the Game class to do any Level-specific drawing.
Level_1.prototype.draw = function() {
}
//}}}

/*
 * =============================================================================
 * Level_2
 * =============================================================================
 */
//{{{ 
var Level_2 = function() { 
    'use strict';
};

// -----------------------------------------------------------------------------
// prototype
// -----------------------------------------------------------------------------
// Set up prototype to enable inheritance from GameLevel
Level_2.prototype = function() {
    'use strict';
    
    // Create a new, empty object
    var inherited = function() { };
    
    // Copy the 'GameLevel' prototype to it
    inherited.prototype = GameLevel.prototype;
    
    // Return a new copy of the object
    return new inherited();
}();

// -----------------------------------------------------------------------------
// setup()
// -----------------------------------------------------------------------------
// Set up the level, creating and initialising the level-specific elements
Level_2.prototype.setup = function() {
    var options;
    var mob;
    
    // Load the level
    this.game.tiles.load(2);

    // Set up the entry and exit doors and re-position them    
    this.game.entry_door.active = true;
    this.game.entry_door.x = (1 * this.game.cell_size);
    this.game.entry_door.y = this.game.max_y - ((1 * this.game.cell_size) + 160);

    this.game.exit_door.active = true
    this.game.exit_door.reposition((2 * this.game.cell_size), (2 * this.game.cell_size));
    
    // Position Clank at the entry door
    this.game.clank.x = this.game.entry_door.x + (this.game.cell_size + 20);
    this.game.clank.y = this.game.entry_door.y + (this.game.cell_size + 40);
    this.game.clank.anim = this.game.clank.entering_anim;
    this.game.clank.active = false;

    // Create fixtures
    this.platform_switch = new Switch({image: "graphics/switch_01.png", frame_size: [40, 40], x: 680, y: 320});
    this.platform_switch.init(this.game);
    this.game.fixture_controller.add(this.platform_switch);

    battery = new Battery(
        {
            image: "graphics/battery_01.png",
            frame_size: [40, 40],
            x: (24 * this.game.cell_size),
            y: (4 * this.game.cell_size)
        }
    );
    battery.init(this.game);
    this.game.fixture_controller.add(battery);

    battery = new Battery(
        {
            image: "graphics/battery_01.png",
            frame_size: [40, 40],
            x: (6 * this.game.cell_size),
            y: (18 * this.game.cell_size)
        }
    );
    battery.init(this.game);
    this.game.fixture_controller.add(battery);

    // Create mobiles    
    mob = new Mob(
        {
            image: "graphics/gear_01a.png",
            left_anim: "graphics/gear_01b.png",
            right_anim: "graphics/gear_01a.png",
            frame_size: [40, 40],
            frame_duration: 100,
            x: (4 * this.game.cell_size),
            y: this.game.max_y - (this.game.cell_size * 7) - 1,
            x_speed: 1,
            max: 5,
            gap_x: 200
        }
    );
    mob.init(this.game);
    this.game.mob_controller.add(mob);
    
    mob = new Mob(
        {
            image: "graphics/gear_01b.png",
            left_anim: "graphics/gear_01b.png",
            right_anim: "graphics/gear_01a.png",
            frame_size: [40, 40],
            frame_duration: 100,
            x: this.game.max_x - (4 * this.game.cell_size),
            y: this.game.max_y - (this.game.cell_size * 13) - 1,
            x_speed: -1,
            max: 5,
            gap_x: 200
        }
    );
    mob.init(this.game);
    this.game.mob_controller.add(mob);
    
    // Create platforms
    options = {image: "graphics/platform_01.png", cell_range: [ 2, 6, 14, 6], cell_x: 14, cell_y: 6, x_speed: -1, y_speed: 0};      
    this.game.platform_controller.add(options);
    
    // Allow a couple of seconds pause before the level starts running
    this.countdown = this.game.timer.start_countdown(1);
}

// -----------------------------------------------------------------------------
// clear()
// -----------------------------------------------------------------------------
// Remove the level-specific elements. Most of this is handled automatically by
// the Game class, provided the main Controller classes are used to contain the
// elements. Any elements created by the Level itself must be cleared here.
Level_2.prototype.clear = function() {
    // Call the inherited method
    GameLevel.prototype.clear.call(this);
    // Do our own clear-up
    this.platform_switch = null;   
}

// -----------------------------------------------------------------------------
// update()
// -----------------------------------------------------------------------------
// Updates the level-specific elements. Elements which are handled by the main
// Controller classes will be automatically handled by the Game class.
Level_2.prototype.update = function() {
    // After the initial pause at the start of the level, open the entry door
    // and let Clank enter, then start the level running fully.
    if ((this.game.state == LVL_STATE.ENTERING) && (this.countdown.expired)) {
        this.game.entry_door.open();
        this.game.clank.active = true;
        this.game.clank.anim.index = 0;
        this.game.state = LVL_STATE.ACTIVE;
        this.countdown.reset(1);
    }

    // Once the level is active, close the entry door    
    if ((this.game.state == LVL_STATE.ACTIVE) && (this.game.entry_door.is_open) && (this.countdown.expired)) {
        this.game.entry_door.close();
    }

    this.game.mob_controller.removeIf( function(item) {
            return ((item.y > 640) && ((item.x < 60) || (item.x > 1500))); 
    });
    
    this.game.dialog.update();
    
    if ((this.game.state == LVL_STATE.ACTIVE) && (this.game.exit_door.at_door(this.game.clank))) {
        // Clank has reached the exit door. Start the exit procedure.
        this.game.exit_door.open();
        this.game.clank.x = this.game.exit_door.x + 60;
        this.game.clank.y = this.game.exit_door.y + 80;
        this.countdown.reset(2);
        this.game.state = LVL_STATE.LEAVING;
    }
    
    if ((this.game.state == LVL_STATE.LEAVING) && (this.countdown.expired)) {
        // Go to the next level
        this.game.exit_door.close();
        this.active = false;
        this.game.next_level(3);
    }

    // Check the platform switch
    if ((this.game.state == LVL_STATE.ACTIVE) && (!this.game.platform_controller.is_operating)) {
        if (this.platform_switch.is_on) {
            this.game.platform_controller.start();
        }
    }
}

// -----------------------------------------------------------------------------
// draw()
// -----------------------------------------------------------------------------
// Called by the Game class to do any Level-specific drawing.
Level_2.prototype.draw = function() {
}
//}}}

/*
 * =============================================================================
 * Level_3
 * =============================================================================
 */
//{{{ 
var Level_3 = function() { 
    'use strict';
};

// -----------------------------------------------------------------------------
// prototype
// -----------------------------------------------------------------------------
// Set up prototype to enable inheritance from GameLevel
Level_3.prototype = function() {
    'use strict';
    
    // Create a new, empty object
    var inherited = function() { };
    
    // Copy the 'GameLevel' prototype to it
    inherited.prototype = GameLevel.prototype;
    
    // Return a new copy of the object
    return new inherited();
}();

// -----------------------------------------------------------------------------
// setup()
// -----------------------------------------------------------------------------
// Set up the level, creating and initialising the level-specific elements
Level_3.prototype.setup = function() {
    var options;
    var mob;
    var y_pos;
    
    // Load the level
    this.game.tiles.load(3);

    // Set up the entry and exit doors and re-position them    
    this.game.entry_door.active = true;
    this.game.entry_door.x = (1 * this.game.cell_size);
    this.game.entry_door.y = this.game.max_y - ((1 * this.game.cell_size) + 160);

    this.game.exit_door.active = true
    this.game.exit_door.reposition(22 * this.game.cell_size, 1 * this.game.cell_size);
    
    // Position Clank at the entry door
    this.game.clank.x = this.game.entry_door.x + (this.game.cell_size + 20);
    this.game.clank.y = this.game.entry_door.y + (this.game.cell_size + 40);
    this.game.clank.anim = this.game.clank.entering_anim;
    this.game.clank.active = false;
    
    // Create fixtures
    battery = new Battery(
        {
            image: "graphics/battery_01.png",
            frame_size: [40, 40],
            x: (6 * this.game.cell_size),
            y: (18 * this.game.cell_size)
        }
    );
    battery.init(this.game);
    this.game.fixture_controller.add(battery);

    battery = new Battery(
        {
            image: "graphics/battery_01.png",
            frame_size: [40, 40],
            x: (27 * this.game.cell_size),
            y: (12 * this.game.cell_size)
        }
    );
    battery.init(this.game);
    this.game.fixture_controller.add(battery);

    
    // Create mobiles
    // Top row of trains
    y_pos = (6 * this.game.cell_size);    
    mob = new Mob(
        {
            image: "graphics/train_01b.png",
            left_anim: "graphics/train_01b.png",
            right_anim: "graphics/train_01a.png",
            frame_size: [160, 40],
            frame_duration: 200,
            x: 1520, 
            y: y_pos,
            x_speed: -1,
            max: 3,
            gap_x: 480,
            gravity: 0,
            range: [1, y_pos, 1520, y_pos]
        }
    );
    mob.init(this.game);
    this.game.mob_controller.add(mob);

    // Bottom row of trains
    y_pos = (12 * this.game.cell_size);
    mob = new Mob(
        {
            image: "graphics/train_01a.png",
            left_anim: "graphics/train_01b.png",
            right_anim: "graphics/train_01a.png",
            frame_size: [160, 40],
            frame_duration: 200,
            x: 40, 
            y: y_pos,
            x_speed: 1,
            max: 3,
            gap_x: 480,
            gravity: 0,
            range: [40, y_pos, 1520, y_pos]
        }
    );
    mob.init(this.game);
    this.game.mob_controller.add(mob);

    // Top row of soldiers
    y_pos = 80;    
    mob = new Mob(
        {
            image: "graphics/soldier_01b.png",
            left_anim: "graphics/soldier_01b.png",
            right_anim: "graphics/soldier_01a.png",
            frame_size: [40, 80],
            frame_duration: 200,
            x: 560,
            y: y_pos,
            range: [560,  y_pos, 720, y_pos],
            x_speed: 1,
            max: 1,
        }
    );
    mob.init(this.game);
    this.game.mob_controller.add(mob);
            
    mob = new Mob(
        {
            image: "graphics/soldier_01b.png",
            left_anim: "graphics/soldier_01b.png",
            right_anim: "graphics/soldier_01a.png",
            frame_size: [40, 80],
            frame_duration: 200,
            x: 800,
            y: y_pos,
            range: [800, y_pos, 1120, y_pos],
            x_speed: 1,
            max: 1,
        }
    );
    mob.init(this.game);
    this.game.mob_controller.add(mob);
            
    mob = new Mob(
        {
            image: "graphics/soldier_01b.png",
            left_anim: "graphics/soldier_01b.png",
            right_anim: "graphics/soldier_01a.png",
            frame_size: [40, 80],
            frame_duration: 200,
            x: 1400,
            y: y_pos,
            range: [1200, y_pos, 1360, y_pos],
            x_speed: -1,
            max: 1,
        }
    );
    mob.init(this.game);
    this.game.mob_controller.add(mob);
            
    // Middle row of soldiers
    y_pos = 300;
    mob = new Mob(
        {
            image: "graphics/soldier_01b.png",
            left_anim: "graphics/soldier_01b.png",
            right_anim: "graphics/soldier_01a.png",
            frame_size: [40, 80],
            frame_duration: 200,
            x: 80,
            y: y_pos,            
            range: [80, y_pos, 240, y_pos],
            x_speed: 1,
            max: 1,
        }
    );
    mob.init(this.game);
    this.game.mob_controller.add(mob);
            
    mob = new Mob(
        {
            image: "graphics/soldier_01b.png",
            left_anim: "graphics/soldier_01b.png",
            right_anim: "graphics/soldier_01a.png",
            frame_size: [40, 80],
            frame_duration: 200,
            x: 520,
            y: y_pos,            
            range: [400, y_pos, 560, y_pos],
            x_speed: -1,
            max: 1,
        }
    );
    mob.init(this.game);
    this.game.mob_controller.add(mob);
            
    mob = new Mob(
        {
            image: "graphics/soldier_01b.png",
            left_anim: "graphics/soldier_01b.png",
            right_anim: "graphics/soldier_01a.png",
            frame_size: [40, 80],
            frame_duration: 200,
            x: 840,
            y: y_pos,            
            range: [720, y_pos, 880, y_pos],
            x_speed: 1,
            max: 1
        }
    );
    mob.init(this.game);
    this.game.mob_controller.add(mob);
            
    mob = new Mob(
        {
            image: "graphics/soldier_01b.png",
            left_anim: "graphics/soldier_01b.png",
            right_anim: "graphics/soldier_01a.png",
            frame_size: [40, 80],
            frame_duration: 200,
            x: 1160,
            y: y_pos,            
            range: [1040, y_pos, 1200, y_pos],
            x_speed: -1,
            max: 1
        }
    );
    mob.init(this.game);
    this.game.mob_controller.add(mob);
            
    mob = new Mob(
        {
            image: "graphics/soldier_01b.png",
            left_anim: "graphics/soldier_01b.png",
            right_anim: "graphics/soldier_01a.png",
            frame_size: [40, 80],
            frame_duration: 200,
            x: 1480,
            y: y_pos,            
            range: [1360, y_pos, 1520, y_pos],
            x_speed: 1,
            max: 1
        }
    );
    mob.init(this.game);
    this.game.mob_controller.add(mob);

    // Bottom row of soldiers
    y_pos = 540;
    mob = new Mob(
        {
            image: "graphics/soldier_01b.png",
            left_anim: "graphics/soldier_01b.png",
            right_anim: "graphics/soldier_01a.png",
            frame_size: [40, 80],
            frame_duration: 200,
            x: 320,
            y: y_pos,            
            range: [200, y_pos, 360, y_pos],
            x_speed: -1,
            max: 1
        }
    );
    mob.init(this.game);
    this.game.mob_controller.add(mob);
            
    mob = new Mob(
        {
            image: "graphics/soldier_01a.png",
            left_anim: "graphics/soldier_01b.png",
            right_anim: "graphics/soldier_01a.png",
            frame_size: [40, 80],
            frame_duration: 200,
            x: 520,
            y: y_pos,            
            range: [520, y_pos, 680, y_pos],
            x_speed: 1,
            max: 1
        }
    );
    mob.init(this.game);
    this.game.mob_controller.add(mob);
            
    mob = new Mob(
        {
            image: "graphics/soldier_01b.png",
            left_anim: "graphics/soldier_01b.png",
            right_anim: "graphics/soldier_01a.png",
            frame_size: [40, 80],
            frame_duration: 200,
            x: 960,
            y: y_pos,            
            range: [840, y_pos, 1000, y_pos],
            x_speed: -1,
            max: 1
        }
    );
    mob.init(this.game);
    this.game.mob_controller.add(mob);

    mob = new Mob(
        {
            image: "graphics/soldier_01a.png",
            left_anim: "graphics/soldier_01b.png",
            right_anim: "graphics/soldier_01a.png",
            frame_size: [40, 80],
            frame_duration: 200,
            x: 1160,
            y: y_pos,            
            range: [1160, y_pos, 1280, y_pos],
            x_speed: 1,
            max: 1
        }
    );
    mob.init(this.game);
    this.game.mob_controller.add(mob);

    // Create platforms
    
    // Allow a couple of seconds pause before the level starts running
    this.countdown = this.game.timer.start_countdown(2);
}

// -----------------------------------------------------------------------------
// clear()
// -----------------------------------------------------------------------------
// Remove the level-specific elements. Most of this is handled automatically by
// the Game class, provided the main Controller classes are used to contain the
// elements. Any elements created by the Level itself must be cleared here.
Level_3.prototype.clear = function() {
    // Call the inherited method
    GameLevel.prototype.clear.call(this);
    // Do our own clear-up
    // ...    
}

// -----------------------------------------------------------------------------
// update()
// -----------------------------------------------------------------------------
// Updates the level-specific elements. Elements which are handled by the main
// Controller classes will be automatically handled by the Game class.
Level_3.prototype.update = function() {
    // After the initial pause at the start of the level, open the entry door
    // and let Clank enter, then start the level running fully.
    if ((this.game.state == LVL_STATE.ENTERING) && (this.countdown.expired)) {
        this.game.entry_door.open();
        this.game.clank.active = true;
        this.game.clank.anim.index = 0;
        this.game.state = LVL_STATE.ACTIVE;
        this.countdown.reset(1);
    }

    // Once the level is active, close the entry door    
    if ((this.game.state == LVL_STATE.ACTIVE) && (this.game.entry_door.is_open) && (this.countdown.expired)) {
        this.game.entry_door.close();
    }
    
    this.game.dialog.update();
    
    if ((this.game.state == LVL_STATE.ACTIVE) && (this.game.exit_door.at_door(this.game.clank))) {
        // Clank has reached the exit door. Start the exit procedure.
        this.game.exit_door.open();
        this.game.clank.x = this.game.exit_door.x + 60;
        this.game.clank.y = this.game.exit_door.y + 80;
        this.countdown.reset(2);
        this.game.state = LVL_STATE.LEAVING;
    }
    
    if ((this.game.state == LVL_STATE.LEAVING) && (this.countdown.expired)) {
        // Go to the next level
        this.game.exit_door.close();
        this.active = false;
        this.game.next_level(4);
    }
}

// -----------------------------------------------------------------------------
// draw()
// -----------------------------------------------------------------------------
// Called by the Game class to do any Level-specific drawing.
Level_3.prototype.draw = function() {
}
//}}}

/*
 * =============================================================================
 * Level_4
 * =============================================================================
 */
//{{{ 
var Level_4 = function() { 
    'use strict';
};

// -----------------------------------------------------------------------------
// prototype
// -----------------------------------------------------------------------------
// Set up prototype to enable inheritance from GameLevel
Level_4.prototype = function() {
    'use strict';
    
    // Create a new, empty object
    var inherited = function() { };
    
    // Copy the 'GameLevel' prototype to it
    inherited.prototype = GameLevel.prototype;
    
    // Return a new copy of the object
    return new inherited();
}();

// -----------------------------------------------------------------------------
// setup()
// -----------------------------------------------------------------------------
// Set up the level, creating and initialising the level-specific elements
Level_4.prototype.setup = function() {
    var mob;
    var battery;
    var jet;
    var x_pos;
    var i;
    var options;
    
    // Load the level
    this.game.tiles.load(4);

    // Set up the entry and exit doors and re-position them    
    this.game.entry_door.active = true;
    this.game.entry_door.reposition(80, 80);

    this.game.exit_door.active = false
    
    // Position Clank at the entry door
    this.game.clank.x = this.game.entry_door.x + (this.game.cell_size + 20);
    this.game.clank.y = this.game.entry_door.y + (this.game.cell_size + 40);
    this.game.clank.anim = this.game.clank.entering_anim;
    this.game.clank.active = false;
    
    // Create fixtures
    this.end_switch = new Switch({image: "graphics/switch_01.png", frame_size: [40, 40], x: 1200, y: 720});
    this.end_switch.init(this.game);
    this.game.fixture_controller.add(this.end_switch);
    
    this.door_switch = new Switch({image: "graphics/switch_01.png", frame_size: [40, 40], x: 80, y: 720});
    this.door_switch.init(this.game);
    this.game.fixture_controller.add(this.door_switch);
    this.door_open = false;

    battery = new Battery(
        {
            image: "graphics/battery_01.png",
            frame_size: [40, 40],
            x: 120,
            y: 720
        }
    );
    battery.init(this.game);
    this.game.fixture_controller.add(battery);
    
    battery = new Battery(
        {
            image: "graphics/battery_01.png",
            frame_size: [40, 40],
            x: (11 * this.game.cell_size),
            y: (5 * this.game.cell_size)
        }
    );
    battery.init(this.game);
    this.game.fixture_controller.add(battery);
    
    battery = new Battery(
        {
            image: "graphics/battery_01.png",
            frame_size: [40, 40],
            x: (29 * this.game.cell_size),
            y: (5 * this.game.cell_size)
        }
    );
    battery.init(this.game);
    this.game.fixture_controller.add(battery);
    
    options =
        {
            image: "graphics/steam_01.png",
            frame_size: [40, 80],
            x: 10 * this.game.cell_size,
            y: 3 * this.game.cell_size,
            delay: 2,
            duration: 1,
            interval: 4
        };

    for (i = 0; i < 12; i++) {        
        jet = new SteamJet(options);
        jet.init(this.game);
        this.game.fixture_controller.add(jet);
        options.delay += 1;
        options.x += 80;
        if (i == 3) {
            options.x += 80;
        }
    }


    // Create mobiles    
    mob = new Mob(
        {
            image: "graphics/gear_01b.png",
            left_anim: "graphics/gear_01b.png",
            right_anim: "graphics/gear_01a.png",
            frame_size: [40, 40],
            frame_duration: 100,
            x: (3 * this.game.cell_size),
            y: (9 * this.game.cell_size),
            x_speed: 1,
            max: 5,
            gap_x: 200
        }
    );
    mob.init(this.game);
    this.game.mob_controller.add(mob);
    
    mob = new Mob(
        {
            image: "graphics/gear_01b.png",
            left_anim: "graphics/gear_01b.png",
            right_anim: "graphics/gear_01a.png",
            frame_size: [40, 40],
            frame_duration: 100,
            x: (24 * this.game.cell_size),
            y:  (7 * this.game.cell_size),
            x_speed: -1,
            max: 5,
            gap_x: 200
        }
    );
    mob.init(this.game);
    this.game.mob_controller.add(mob);
    
    // Create platforms
    
    // Allow a couple of seconds pause before the level starts running
    this.countdown = this.game.timer.start_countdown(1);
}

// -----------------------------------------------------------------------------
// clear()
// -----------------------------------------------------------------------------
// Remove the level-specific elements. Most of this is handled automatically by
// the Game class, provided the main Controller classes are used to contain the
// elements. Any elements created by the Level itself must be cleared here.
Level_4.prototype.clear = function() {
    // Call the inherited method
    GameLevel.prototype.clear.call(this);
    // Do our own clear-up
    // ...    
}

// -----------------------------------------------------------------------------
// update()
// -----------------------------------------------------------------------------
// Updates the level-specific elements. Elements which are handled by the main
// Controller classes will be automatically handled by the Game class.
Level_4.prototype.update = function() {
    // After the initial pause at the start of the level, open the entry door
    // and let Clank enter, then start the level running fully.
    if ((this.game.state == LVL_STATE.ENTERING) && (this.countdown.expired)) {
        this.game.entry_door.open();
        this.game.clank.active = true;
        this.game.clank.anim.index = 0;
        this.game.state = LVL_STATE.ACTIVE;
        this.countdown.reset(1);
    }

    // Once the level is active, close the entry door    
    if ((this.game.state == LVL_STATE.ACTIVE) && (this.game.entry_door.is_open) && (this.countdown.expired)) {
        this.game.entry_door.close();
    }
    
    this.game.mob_controller.removeIf( function(item) {
            return ((item.x < 80) || (item.x > 1040)); 
    });
    
    if ((this.game.state == LVL_STATE.ACTIVE) && (this.door_switch.is_on) && (!this.door_open)) {
        var i;
        for (i = 1; i < 6; i++) {
            cell = this.game.tiles.tilemap.cells[27][i] = [];
        }
        this.door_open = true;
        this.game.dialog.show(8);
    }
    
    this.game.dialog.update();
    
    if ((this.game.state == LVL_STATE.ACTIVE) && (this.end_switch.is_on)) {
        this.game.state = LVL_STATE.GAMEWON;
    }
    
}

// -----------------------------------------------------------------------------
// draw()
// -----------------------------------------------------------------------------
// Called by the Game class to do any Level-specific drawing.
Level_4.prototype.draw = function() {
}
//}}}

/*
 * =============================================================================
 * Main game state handler.
 * =============================================================================
 */
//{{{ 
var Game = function() { }

Game.prototype.setupMusic = function() {
    W_SPEED_NORMAL = 0.2;
    W_SPEED_FAST = 0.5;
    /*
    this.menuTrack = new Audio("sounds/DST-Blanket.ogg");
    this.menuTrack.addEventListener("ended", function() {
        this.currentTime = 0;
        this.play();
    }, false);
    */
    this.gameTrack = new Audio("sounds/DST-AngryRobotIII.ogg");
    this.gameTrack.addEventListener("ended", function() {
        this.currentTime = 0;
        this.play();
    }, false);
}

// -----------------------------------------------------------------------------
// setup()
// -----------------------------------------------------------------------------
// Creates and initialises the main game elements and controllers
Game.prototype.setup = function() {
    this.canvas  = document.getElementById("board");
    this.context = this.canvas.getContext("2d");
    
    this.context.font      = "11px Verdana";
    this.context.fillStyle = "#cccccc";
    
    this.state = LVL_STATE.SETUP;
    
    // Prepare the game timer
    this.timer = new Timer();
    this.timer.setup();
    
    // Set up the tilemap and viewport parameters      
    this.cells_x = 40;
    this.cells_y = 20;
    this.cell_size = 40;
    this.max_x = this.cells_x * this.cell_size;
    this.max_y = this.cells_y * this.cell_size;
    this.viewport = new jaws.Viewport({max_x: this.max_x, max_y: this.max_y});
    this.back_viewport = new jaws.Viewport({max_x: this.max_x, max_y: this.max_y});
    
    this.clank = new Clank({x: 120, y: this.max_y - (80 + this.cell_size)});
    this.clank.init(this);
    
    this.fader = new Fader({});
    this.fader.init(this);
    
    this.sky = new Storm();
    this.sky.setup();
    
    this.tiles = new Tiles();
    this.tiles.setup(this);
    
    this.mob_controller = new MobController();
    this.mob_controller.init(this);
    
    this.fixture_controller = new FixtureController();
    this.fixture_controller.init(this);
    
    this.entry_door = new Door({image: "graphics/door_01.png", x: 40, y: this.max_y - 200});
    this.entry_door.init(this.game);
    
    this.exit_door = new Door({image: "graphics/door_01.png", x: this.max_x - 280, y: this.max_y - ((8 * 40) + 160)});
    this.exit_door.init(this.game);
    
    this.platform_controller = new PlatformController({}, this);
    
    this.dialog = new Dialog({image: "graphics/dialog_00.png", x: 40, y: -180});
    this.dialog.init(this);
    
    var that = this;
    jaws.on_keydown(["left_mouse_button", "right_mouse_button"], function(key) { that.onclick(key); });
    jaws.on_keyup(["enter"], function(key) { that.onclick(key); });

    this.setupMusic();
    this.gameTrack.play();
    
    this.level = new IntroLevel();
    this.level.init(this);
    
    // Start the level. Start the time counter to give a short pause before
    // the level begins.
    this.state = LVL_STATE.ENTERING;
    this.timer.start_counter();
};

// -----------------------------------------------------------------------------
// update()
// -----------------------------------------------------------------------------
// Updates the main game elements, and calls the update() for the current level
// to allow level-specific elements to be updated.
Game.prototype.update = function() {
    this.timer.update();
    this.sky.update();
    // Only update the various scene elements when Clank has properly
    // entered the level
    if (this.state == LVL_STATE.ACTIVE) {
        this.mob_controller.update();
        this.fixture_controller.update();
        this.platform_controller.update();
        this.clank.update();
    }
    this.back_viewport.centerAround(this.clank);      
    this.viewport.centerAround(this.clank)
    this.dialog.update();
    if (this.state < LVL_STATE.GAMEWON) {
        this.level.update();
        this.fader.update();
        if (this.clank.damage == this.clank.hit_points) {
            this.fader.show(2);
            this.state = LVL_STATE.GAMELOST;
        } else if (this.state == LVL_STATE.GAMEWON) {
            this.fader.show(1);
        }
    }
};

// -----------------------------------------------------------------------------
// draw()
// -----------------------------------------------------------------------------
// Draws the main game elements, and calls the draw() for the current level to
// allow level-specific elements to be drawn
Game.prototype.draw = function() {
    jaws.clear();
    this.sky.draw();
    this.back_viewport.drawTileMap(this.tiles.back_tilemap);
    this.viewport.draw(this.platform_controller);
    this.viewport.drawTileMap(this.tiles.tilemap);
    this.viewport.draw(this.entry_door);
    this.viewport.draw(this.exit_door);
    this.fixture_controller.draw();
    this.viewport.draw(this.clank);
    this.mob_controller.draw();
    if (this.state > LVL_STATE.ENTERING) {
        this.viewport.draw(this.clank);
        this.clank.energy_indicator.draw();
    }
    this.dialog.draw();
    this.level.draw();
    this.fader.draw();
      //this.context.textAlign = "center";
      //this.context.fillText(this.clank.cell_x + ", " + this.clank.cell_y, this.clank.x + 20 - this.viewport.x, this.clank.y - 16);
};

// -----------------------------------------------------------------------------
// on_click
// -----------------------------------------------------------------------------
// Handles mouse-clicks and global key-presses
Game.prototype.onclick = function(key) {
    if ((this.state >= LVL_STATE.GAMEWON)) {
        window.location.reload();
        this.clank.setup();
        this.next_level(0);
    } else {
        if ((this.dialog.state == DLG_STATE.ACTIVE) && (key == "enter")) {
            this.dialog.hide();
        }
        if ((this.dialog.state == DLG_STATE.ACTIVE) && (this.dialog.rect().collidePoint(jaws.mouse_x, jaws.mouse_y))) {
            this.dialog.hide();
        }
    }
};

// -----------------------------------------------------------------------------
// next_level(level)
// -----------------------------------------------------------------------------
// Clears the current level, then loads and activates the specified next level
Game.prototype.next_level = function(level) {
    'use strict';
    // Temporarily disable any updates/draws
    this.active = false;
    
    // Clear this level
    this.level.clear();
    
    // Load and initialise the next level
    switch (level) {
      case 0:
        this.level = new IntroLevel();
        break;
      case 1:
        this.level = new Level_1();
        break;
      case 2:
        this.level = new Level_2();
        break;
      case 3:
        this.level = new Level_3();
        break;
      case 4:
        this.level = new Level_4();
        break;
      case 5:
        this.level = new Level_5();
        break;
      case 6:
        this.level = new Level_6();
        break;
    }
    this.level.init(this);
    this.fader.hide();

    // Re-activate the game and start the level
    this.active = true;
    this.state = LVL_STATE.ENTERING;
};
//}}}

/*
 * =============================================================================
 * Main entry point
 * =============================================================================
 * Loads the game assets and launches the game intro.
 */
 
jaws.onload = function( ) {
    // Pre-load the game assets
    jaws.assets.add( [
            "graphics/clank_01a.png",
            "graphics/clank_01b.png",
            "graphics/clank_damage_01.png",
            "graphics/energy_01.png",
            "graphics/gear_01a.png",
            "graphics/gear_01b.png",
            "graphics/starry_sky_01.png",
            "graphics/clouds_01.png",
            "graphics/clouds_02.png",
            "graphics/floor_tile_left_01.png",
            "graphics/floor_tile_right_01.png",
            "graphics/wall_tile_01.png",
            "graphics/switch_01.png",
            "graphics/battery_01.png",
            "graphics/platform_01.png",
            "graphics/door_01.png",
            "graphics/dialog_00.png",
            "graphics/dialog_01.png",
            "graphics/dialog_02.png",
            "graphics/dialog_03.png",
            "graphics/dialog_04.png",
            "graphics/dialog_05.png",
            "graphics/dialog_06.png",
            "graphics/dialog_07.png",
            "graphics/dialog_08.png",
            "graphics/fader_01.png",
            "graphics/fader_02.png",
            "graphics/fader_03.png",
            "graphics/clank_approaching_01.png",
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
            "graphics/steam_01.png",
            "graphics/small/steam_valve_01.png",
            "graphics/dark_clouds_01.png",
            "graphics/dark_clouds_01.png",
            "graphics/lightning_01.png",
            "graphics/lightning_02.png",
            "graphics/rain_01.png",
            "graphics/intro_01.png",
            "graphics/intro_02.png",
            "graphics/title.png",
            "graphics/train_01a.png",
            "graphics/train_01b.png",
            "graphics/soldier_01a.png",
            "graphics/soldier_01b.png",
    ] ); 
    // Start the game running. jaws.start() will handle the game loop for us.
    jaws.start( Game, {fps: 60} ); 
}

