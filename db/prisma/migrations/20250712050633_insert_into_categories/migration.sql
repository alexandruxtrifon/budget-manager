INSERT INTO categories (name, match_keywords) VALUES
('Groceries', ARRAY['carrefour', 'mega image', 'kaufland', 'lidl']),
('Restaurants', ARRAY['mc donalds', 'kfc', 'subway', 'pizza']),
('Entertainment', ARRAY['iabilet', 'cinema', 'netflix', 'spotify']),
('Education', ARRAY['usamv', 'scoala', 'universitate']),
('Transport', ARRAY['uber', 'bolt', 'metrorex', 'ratb']);

INSERT INTO categories (name, match_keywords) VALUES
('Groceries', ARRAY[
  'carrefour', 'mega image', 'megaimage', 'dona', 'kaufland', 'lidl', 'penny', 'auchan', 'cora', 'profi',
  'metro', 'supeco', 'interex', 'billa', 'real,-', 'spar', 'alimentara', 'magazin mixt',
  'supermarket', 'mini market', 'market express', 'altex market', 'trenta pizza',
  'alimentar', 'abc market', 'bio shop', 'eco market', 'super save', 'food store',
  'groceries', 'fresh market', 'green market', 'food bazar', 'plafar', 'patiserie',
  'brutarie', 'market', 'piata', 'fruits', 'vegetables', 'boucherie', 'butcher',
  'deli', 'meat market', 'natural', 'produs traditional', 'comert', 'mag prod',
  'aliment', 'express market', 'mini alimentara', 'alimentatie publica'
]);
INSERT INTO categories (name, match_keywords) VALUES
('Restaurants', ARRAY[
  'mc donalds', 'kfc', 'subway', 'pizza hut', 'domino', 'burger king', 'taco bell',
  'mcdonald''s', 'pizzerie', 'restaurant', 'ristorante', 'grill', 'bistro', 'pub',
  'fast food', 'diner', 'osteria', 'cantina', 'catering', 'shaorma', 'kebab', 'food truck',
  'delivery', 'takeaway', 'papa johns', 'dristor', 'springtime', 'la placinte',
  'hanu berarilor', 'trattoria', 'sushi', 'asian food', 'viet food', 'greek food',
  'cafe', 'cafenea', 'coffee shop', 'gourmet', 'tapas', 'bar & grill', 'ramen',
  'food point', 'resto', 'ciorba', 'gratar', 'restaurant traditional', 'meniu zilei',
  'meal', 'comanda mancare'
]);
INSERT INTO categories (name, match_keywords) VALUES
('Entertainment', ARRAY[
  'iabilet', 'eventim', 'cinema', 'movieplex', 'hbo', 'netflix', 'spotify', 'apple music',
  'youtube premium', 'disney plus', 'filme', 'teatru', 'concert', 'spectacol',
  'eveniment', 'stand-up', 'opera', 'circ', 'bilet', 'muzica', 'zilele orasului',
  'club', 'gaming', 'xbox', 'playstation', 'steam', 'epic games', 'league of legends',
  'blizzard', 'riot games', 'google play', 'play store', 'app store', 'board games',
  'escape room', 'karaoke', 'zumba', 'bowling', 'paintball', 'trampoline park',
  'indoor park', 'escape', 'vr experience', 'party', 'festival', 'nordis'
]);
INSERT INTO categories (name, match_keywords) VALUES
('Education', ARRAY[
  'usamv', 'universitate', 'scoala', 'liceu', 'facultate', 'taxa', 'educatie',
  'admitere', 'cursuri', 'invatamant', 'academie', 'university', 'student', 'master',
  'doctorat', 'postliceala', 'institut', 'meditatii', 'manuale', 'books', 'e-learning',
  'coursera', 'udemy', 'edx', 'training', 'certificare', 'examen', 'bacalaureat',
  'platforma educativa', 'licenta', 'inscriere', 'carti', 'educational', 'invatare',
  'educational store', 'eminescu', 'librarie', 'bookstore', 'teach', 'profesor',
  'gradinita', 'after school', 'edu.ro', 'on-line learning', 'examene', 'seminar',
  'workshop', 'curs', 'conferinta', 'sala de curs'
]);
INSERT INTO categories (name, match_keywords) VALUES
('Transport', ARRAY[
  'uber', 'bolt', 'taxi', 'metrorex', 'ratb', 'stb', 'tl', 'transport public',
  'abonament stb', 'metrou', 'tramvai', 'autobuz', 'tren', 'cfr calatori',
  'bilete', 'naveta', 'bucuresti transport', 'airbnb transport', 'booking transfer',
  'aeroport', 'otp', 'flight ticket', 'bilet tren', 'taximetrist', 'rideshare',
  'wizz air', 'ryanair', 'blue air', 'tarom', 'avion', 'trolleybus', 'funicular',
  'feroviar', 'bilete transport', 'transurb', 'transalpina', 'taxa pod', 'vinieta',
  'rovinieta', 'benzina', 'motorina', 'fuel', 'mol', 'omv', 'petrom', 'lukoil',
  'gas station', 'petrol station', 'drum', 'autostrada', 'diesel', 'carburant'
]);