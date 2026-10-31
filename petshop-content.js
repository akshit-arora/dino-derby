// Pixel Pet Shop - words, prices and unlock lists. Edit freely; petshop.js reads all of it from here.
window.PETSHOP = {
  shopName: "Ashwik's Pet Shop",
  items: [
    { id: 'apple', one: 'apple', many: 'apples' },
    { id: 'fish', one: 'fish', many: 'fish' },
    { id: 'bone', one: 'bone', many: 'bones' },
    { id: 'ball', one: 'ball', many: 'balls' },
    { id: 'carrot', one: 'carrot', many: 'carrots' },
    { id: 'cookie', one: 'cookie', many: 'cookies' },
    { id: 'star', one: 'star', many: 'stars' },
    { id: 'heart', one: 'heart', many: 'hearts' }
  ],
  customers: [
    { kind: 'dog', shirt: '#42a5f5' }, { kind: 'cat', shirt: '#ec407a' }, { kind: 'bunny', shirt: '#ab47bc' },
    { kind: 'bear', shirt: '#66bb6a' }, { kind: 'frog', shirt: '#ffa726' }
  ],
  praise: ['Yay, thank you!', 'Perfect!', 'You are so good at counting!', 'Wow, super fast!', 'Thank you, shopkeeper!', 'Just what I wanted!'],
  retry: ['Hmm, not quite. Let us count together!', 'Almost! Let us check.', 'Oh! Let us count it again.'],
  levels: ['Counting', 'Two things', 'Adding', 'Add and take away', 'Coins', 'Change', 'Shop master'],
  // cost in coins
  pets: [
    { id: 'dog', name: 'Puppy', cost: 10 }, { id: 'cat', name: 'Kitten', cost: 15 }, { id: 'bunny', name: 'Bunny', cost: 20 },
    { id: 'bear', name: 'Bear Cub', cost: 30 }, { id: 'frog', name: 'Froggy', cost: 40 },
    { id: 'parrot', name: 'Polly', cost: 55 }, { id: 'dragon', name: 'Ember', cost: 80 }
  ],
  decor: [
    { id: 'bunting', name: 'Flags', cost: 8 }, { id: 'plant', name: 'Plant', cost: 12 }, { id: 'window', name: 'Window', cost: 16 },
    { id: 'balloons', name: 'Balloons', cost: 20 }, { id: 'tank', name: 'Fish tank', cost: 25 }, { id: 'lamp', name: 'Lamp', cost: 30 }
  ],
  customersPerSticker: 5
};
