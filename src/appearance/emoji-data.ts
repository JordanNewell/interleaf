/**
 * The emoji catalog, kept as one plain template literal so tests (and
 * anything else) can pin the raw text without importing TypeScript. Line
 * grammar: `# Category` opens a section; every other line is
 * `emoji name keyword…` — the second token is the `:shortcode:` users type,
 * the rest feed picker search. Native Unicode only, no assets.
 */
export const EMOJI_DATA = `
# Smileys & emotion
😀 grinning grin happy
😃 smiley happy
😄 smile happy open_mouth
😁 beaming grin
😆 laughing squint laugh
😅 sweat_laugh nervous relieved
🤣 rofl rolling laugh
😂 joy tears laugh cry
🙂 slight_smile
🙃 upside_down silly
😉 wink
😊 blush happy pleased
😋 yum tasty
😛 stuck_out_tongue razz
😜 wink_tongue crazy
🤪 zany goofy wild
🤨 raised_eyebrow suspicious
🧐 monocle inspect
😎 sunglasses cool
🤓 nerd glasses
🥳 partying celebrate
😏 smirk smug
😒 unamused meh bored
😞 disappointed sad
😔 pensive sad
😟 worried
😕 confused
🙁 frown sad
☹️ frowning sad
😣 persevere
😖 confounded
😫 weary tired
😩 anguish
😢 cry tear sad
😭 sob cry sad
😤 triumph huff steam
😠 angry mad
😡 rage angry
🤬 cursing swearing
😈 smiling_devil devil mischief
👿 imp devil angry
💀 skull dead
☠️ skull_crossbones danger poison
💩 poop hankey
🤡 clown
👻 ghost spooky
👽 alien ufo
🤖 robot bot
😳 flushed embarrassed
🥵 hot heat
🥶 cold freezing
😨 fearful scared
😰 anxious nervous
😱 scream fear shock
😵 dizzy knocked_out
🤯 mind_blown exploding
🥴 woozy drunk
😴 sleeping zzz
😪 sleepy tired
🤢 nauseated sick green
🤮 vomiting sick
🤧 sneeze
🤒 thermometer fever
🤕 hurt injured
😷 mask medical sick
🥺 pleading puppy_eyes
🤗 hug comfort
🤔 thinking hmm
🤭 oops giggle
🤫 shush quiet secret
🤥 lying pinocchio
😐 neutral_face
😶 no_mouth silent
😇 innocent halo angel
# People & gestures
👋 wave hello goodbye
🤚 raised_back_hand
✋ raised_hand stop
🖖 vulcan spock
👌 ok pinched
🤌 pinched_fingers italian
🤏 pinch tiny
✌️ victory peace
🤞 crossed_fingers luck
🤟 love_you
🤘 rock_on horns metal
🤙 call_me shaka
👈 point_left
👉 point_right
👆 point_up
👇 point_down
☝️ index_up
👍 +1 thumbs_up yes like
👎 -1 thumbs_down no dislike
✊ fist power
👊 punch fist_bump
🤛 left_fist
🤜 right_fist
👏 clap applause
🙌 raised_hands celebrate
👐 open_hands
🤲 palms_up
🤝 handshake deal
🙏 pray thanks please
✍️ writing hand_write
💅 nail_polish manicure
🤳 selfie
💪 muscle flex strong
🧠 brain smart mind
👀 eyes look watch
👁️ eye
👂 ear
👃 nose
👅 tongue
👄 lips mouth
🦷 tooth
👣 footprints steps
🗣️ speaking_head announce
🧑 person
👶 baby
🧓 older
🏃 running run
🚶 walking
🧎 kneeling
💃 dancer dance
🕺 disco dance
👯 party_people bunny
🧘 meditation yoga zen
🛀 bath
🧙 mage wizard
🧚 fairy
🧛 vampire
🧟 zombie
🧞 genie
🧜 merperson
🥷 ninja
🦸 superhero
🦹 supervillain
# Hearts
❤️ red_heart love
🧡 orange_heart
💛 yellow_heart
💚 green_heart
💙 blue_heart
💜 purple_heart
🖤 black_heart
🤍 white_heart
🤎 brown_heart
💔 broken_heart heartbreak
❣️ heart_exclamation
💕 two_hearts
💞 revolving_hearts
💓 beating_heart
💗 growing_heart
💖 sparkling_heart
💘 heart_arrow cupid
💝 heart_ribbon
💟 heart_decoration
💋 kiss_mark lipstick
# Animals & nature
🐶 dog puppy
🐱 cat kitten
🐭 mouse
🐹 hamster
🐰 rabbit bunny
🦊 fox
🐻 bear
🐼 panda
🐨 koala
🐯 tiger
🦁 lion
🐮 cow
🐷 pig
🐸 frog
🐵 monkey
🙈 see_no_evil
🙉 hear_no_evil
🙊 speak_no_evil
🐔 chicken
🐧 penguin
🐦 bird
🦆 duck
🦅 eagle
🦉 owl
🦇 bat
🐺 wolf
🐴 horse
🦄 unicorn
🐝 bee
🐛 bug caterpillar
🦋 butterfly
🐌 snail
🐞 ladybug
🐜 ant
🕷️ spider
🦂 scorpion
🐢 turtle
🐍 snake
🦎 lizard
🐙 octopus
🦑 squid
🦐 shrimp
🦀 crab
🐡 blowfish
🐠 tropical_fish
🐟 fish
🐬 dolphin
🐳 spouting_whale
🐋 whale
🦈 shark
🐊 crocodile
🦓 zebra
🦒 giraffe
🐘 elephant
🦏 rhinoceros
🐪 camel
🦥 sloth
🦔 hedgehog
🐾 paw_prints
🌵 cactus
🎄 christmas_tree
🌲 evergreen_tree
🌳 tree
🌴 palm_tree
🌱 seedling
🌿 herb
☘️ shamrock
🍀 four_leaf_clover lucky
🌷 tulip
🌹 rose
🌻 sunflower
🌼 blossom
🌸 cherry_blossom
🌺 hibiscus
💮 white_flower
🌍 earth_europe
🌎 earth_americas
🌏 earth_asia
🌙 crescent_moon
🌕 full_moon
🌚 new_moon_face
🌝 full_moon_face
⭐ star
🌟 glowing_star
✨ sparkles magic
🌠 shooting_star wish
⚡ lightning zap
🔥 fire flame lit
💧 droplet water
🌊 ocean wave
❄️ snowflake cold
⛄ snowman
☀️ sun sunny
🌈 rainbow
⛅ partly_cloudy
☁️ cloud
🌪️ tornado
# Food & drink
🍏 green_apple
🍎 apple
🍐 pear
🍊 tangerine orange
🍋 lemon
🍌 banana
🍉 watermelon
🍇 grapes
🍓 strawberry
🫐 blueberries
🍒 cherries
🍑 peach
🥭 mango
🍍 pineapple
🥥 coconut
🥝 kiwi
🍅 tomato
🥑 avocado
🍆 eggplant
🥕 carrot
🌽 corn
🌶️ hot_pepper spicy
🥔 potato
🧄 garlic
🧅 onion
🍄 mushroom
🥜 peanuts
🌰 chestnut
🍞 bread
🥐 croissant
🥖 baguette
🥨 pretzel
🧀 cheese
🥚 egg
🍳 cooking fried_egg
🥞 pancakes
🧇 waffle
🥓 bacon
🍖 meat_on_bone
🍗 poultry_leg
🍔 hamburger burger
🍟 fries
🍕 pizza
🌭 hotdog
🥪 sandwich
🌮 taco
🌯 burrito
🥗 salad
🍝 spaghetti pasta
🍜 ramen noodles
🍣 sushi
🍱 bento
🍤 fried_shrimp
🍚 rice
🍛 curry
🍲 stew
🥣 bowl_with_spoon
🍦 soft_serve
🍧 shaved_ice
🍨 ice_cream
🍩 doughnut donut
🍪 cookie
🎂 birthday_cake
🍰 cake shortcake
🧁 cupcake
🥧 pie
🍫 chocolate_bar
🍬 candy sweet
🍭 lollipop
🍯 honey_pot
🍼 baby_bottle
🥛 milk
☕ coffee
🍵 tea
🍶 sake
🍾 champagne
🍷 wine
🍸 cocktail martini
🍹 tiki_drink
🍺 beer
🍻 beer_clink cheers
🥤 cup_with_straw soda
🧋 bubble_tea
🧊 ice_cube
# Activity
⚽ soccer football
🏀 basketball
🏈 american_football
⚾ baseball
🎾 tennis
🏐 volleyball
🥏 frisbee
🎱 pool 8ball
🏓 ping_pong
🏸 badminton
🥊 boxing_glove
🥋 martial_arts
🏆 trophy win champion
🥇 gold_medal first
🥈 silver_medal second
🥉 bronze_medal third
🎯 dart bullseye target
🎳 bowling
🎮 video_game controller gaming
🕹️ joystick arcade
🎲 dice game
🧩 puzzle
🎨 art palette painting
🎭 theater masks
🎪 circus
🎤 microphone karaoke
🎧 headphones music
🎵 musical_note
🎶 musical_notes
🎸 guitar
🎹 piano keyboard
🎺 trumpet
🎻 violin
🥁 drum
🎬 clapper movie film
🏹 bow_and_arrow archery
🎿 skis
🏂 snowboard
🚴 cycling bike
🏊 swimming
🛹 skateboard
🎀 ribbon bow
🎁 gift present birthday
🎈 balloon party
🎉 tada celebrate congrats
🎊 confetti_ball celebrate
🎇 sparkler
🎆 fireworks
# Travel & places
🚗 car
🚕 taxi
🚌 bus
🏎️ race_car
🚓 police_car
🚑 ambulance
🚒 fire_engine
🚚 truck
🚜 tractor
🚲 bicycle bike
🛵 scooter
🏍️ motorcycle
✈️ airplane plane flight
🚀 rocket launch
🛸 ufo flying_saucer
🚁 helicopter
🚂 locomotive train
🚆 train
🚊 tram
⛵ sailboat
🚤 speedboat
⚓ anchor
🗺️ world_map
🧭 compass
🏔️ mountain_snow
⛰️ mountain
🌋 volcano
🏕️ camping
🏖️ beach
🏜️ desert
🏝️ island
🎡 ferris_wheel
🎢 roller_coaster
🎠 carousel
⛲ fountain
🏛️ classical_building
🏗️ construction
🏠 house home
🏡 house_garden
🏢 office_building
🏥 hospital
🏦 bank
🏨 hotel
🏫 school
🌃 night_stars
🌆 city_dusk
🌇 city_sunset
🌉 night_bridge
🚦 traffic_light
🛑 stop_sign
# Objects
⌚ watch time
📱 phone mobile smartphone
💻 laptop
⌨️ keyboard
🖥️ computer desktop
🖨️ printer
🖱️ computer_mouse
💾 floppy_disk save
💿 cd
📀 dvd
🎥 movie_camera
📷 camera photo
📸 camera_flash
📹 video_camera
🔍 mag search
🕯️ candle
💡 bulb idea
🔦 flashlight torch
🏮 lantern
📖 open_book read
📚 books library
📓 notebook
📜 scroll
📰 newspaper news
📎 paperclip attachment
✂️ scissors cut
📐 triangular_ruler
📏 ruler
🔒 lock locked secure
🔓 unlock
🔑 key
🗝️ old_key
🔨 hammer
🪓 axe
⛏️ pick
🔧 wrench fix
🔩 bolt nut
⚙️ gear settings
🧰 toolbox
🧲 magnet
🧪 test_tube science
🧬 dna
🔬 microscope science
🔭 telescope space
💉 syringe vaccine shot
💊 pill medicine
🩹 bandaid
🚪 door
🛏️ bed sleep
🛋️ couch sofa
🚽 toilet
🚿 shower
🛁 bathtub
🧹 broom sweep
🧺 basket
🛒 shopping_cart
💰 money_bag
💵 dollar money
💳 credit_card payment
📈 chart_up
📉 chart_down
📊 bar_chart
📅 calendar
⏰ alarm_clock morning
⏳ hourglass time
📡 satellite signal
🔋 battery
🔌 plug
📺 tv television
📻 radio
🎙️ studio_mic podcast
🔔 bell notification
🔕 bell_mute
📢 loudspeaker announcement
📣 megaphone cheer
📮 postbox
📭 mailbox_empty
✉️ envelope mail letter
📦 package parcel
🖊️ pen
🖌️ paintbrush
📝 memo note write
# Symbols
♻️ recycle
🔱 trident
📛 name_badge
⭕ circle
✅ white_check_mark yes done
☑️ checkbox_with_check
✔️ check_mark
❌ cross no wrong
❎ x_button
➕ plus
➖ minus
➗ divide
✖️ multiply
💯 hundred perfect score
♠️ spades cards
♥️ heart_suit cards
♦️ diamonds cards
♣️ clubs cards
⬅️ arrow_left
➡️ arrow_right
⬆️ arrow_up
⬇️ arrow_down
↗️ arrow_upper_right
↘️ arrow_lower_right
↩️ arrow_left_hook reply
↪️ arrow_right_hook forward
🔁 repeat loop
🔄 refresh sync
⏩ fast_forward
⏪ rewind
▶️ play
⏸️ pause
⏹️ stop
🔀 shuffle random
🔊 speaker volume
🔇 mute sound_off
📶 signal bars
⚠️ warning caution
🚫 prohibited blocked
⛔ no_entry
❓ question
❗ exclamation
⁉️ interrobang
🆗 ok_button
🆕 new
🔝 top
🔜 soon
➰ curly_loop
〰️ wavy_dash
©️ copyright
®️ registered
™️ tm trademark
🔴 red_circle
🟢 green_circle
🔵 blue_circle
🟡 yellow_circle
🟣 purple_circle
🟥 red_square
🟩 green_square
🟦 blue_square
🟨 yellow_square
🟪 purple_square
💤 zzz sleep
`;

export interface EmojiCategoryMeta {
  /** Stable slug for DOM data attributes. */
  id: string;
  /** Human label; also the exact `# …` section header in EMOJI_DATA. */
  name: string;
}

/**
 * Picker tab metadata — array order is tab order and must mirror the `#`
 * section order in EMOJI_DATA (the parser keys sections off these names).
 */
export const EMOJI_CATEGORIES: EmojiCategoryMeta[] = [
  { id: "smileys", name: "Smileys & emotion" },
  { id: "people", name: "People & gestures" },
  { id: "hearts", name: "Hearts" },
  { id: "nature", name: "Animals & nature" },
  { id: "food", name: "Food & drink" },
  { id: "activity", name: "Activity" },
  { id: "travel", name: "Travel & places" },
  { id: "objects", name: "Objects" },
  { id: "symbols", name: "Symbols" },
];
