const { createClient } = require('@supabase/supabase-js');
const { HfInference } = require('@huggingface/inference');
require('dotenv').config();

// Use SERVICE_ROLE_KEY to bypass RAG/RLS during seeding if needed
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const hf = new HfInference(process.env.HF_TOKEN);

async function seed() {
    const movies = [
        { id: 27205, title: "Inception", desc: "A thief who steals corporate secrets through the use of dream-sharing technology. Sci-fi mind-bending thriller." },
        { id: 157336, title: "Interstellar", desc: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival. Space exploration sci-fi." },
        { id: 155, title: "The Dark Knight", desc: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham. Gritty superhero crime drama." },
        { id: 603, title: "The Matrix", desc: "A computer hacker learns from mysterious rebels about the true nature of his reality. Cyberpunk action sci-fi." },
        { id: 24428, title: "The Avengers", desc: "Earth's mightiest heroes must come together and learn to fight as a team. Superhero action block-buster." },
        { id: 122, title: "The Lord of the Rings: The Return of the King", desc: "Aragorn is revealed as the heir to the ancient kings as he, Gandalf and the other members of the broken fellowship struggle to save Gondor." },
        { id: 13, title: "Forrest Gump", desc: "The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other historical events unfold from the perspective of an Alabama man." },
        { id: 680, title: "Pulp Fiction", desc: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption." },
        { id: 238, title: "The Godfather", desc: "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family. Epic crime drama." },
        { id: 424, title: "Schindler's List", desc: "In German-occupied Poland during World War II, industrialist Oskar Schindler gradually becomes concerned for his Jewish workforce after witnessing their persecution by the Nazis." },
        { id: 129, title: "Spirited Away", desc: "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches and spirits, and where humans are changed into beasts." },
        { id: 497, title: "The Green Mile", desc: "A supernatural tale set on death row in a Southern prison, where gentle giant John Coffey possesses the mysterious power to heal people's ailments." },
        { id: 637, title: "Life Is Beautiful", desc: "A touching story of an Italian bookshop owner who uses his imagination to shield his son from the horrors of internment in a Nazi concentration camp." },
        { id: 550, title: "Fight Club", desc: "An insomniac office worker and a devil-may-care soapmaker form an underground fight club that evolves into much more. Psychological drama." },
        { id: 105, title: "Back to the Future", desc: "Marty McFly, a typical American teenager of the Eighties, is accidentally sent back to 1955 in a plutonium-powered DeLorean 'time machine' invented by a slightly mad scientist." },
        { id: 11, title: "Star Wars", desc: "Princess Leia is captured and held hostage by the evil Imperial forces in their effort to take over the galactic Empire. Luke Skywalker and Han Solo must save her." },
        { id: 694, title: "The Shining", desc: "A family heads to an isolated hotel for the winter where a sinister presence influences the father into violence, while his psychic son sees horrific forebodings from both past and future." },
        { id: 807, title: "Se7en", desc: "Two detectives, a rookie and a veteran, hunt a serial killer who uses the seven deadly sins as his motives. Dark crime thriller." },
        { id: 278, title: "The Shawshank Redemption", desc: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency." },
        { id: 19995, title: "Avatar", desc: "A paraplegic Marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders and protecting the world he feels is his home." },
        { id: 597, title: "Titanic", desc: "A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the luxurious, ill-fated R.M.S. Titanic." },
        { id: 496243, title: "Parasite", desc: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan." },
        { id: 557, title: "Spider-Man", desc: "After being bitten by a genetically altered spider, nerdy high school student Peter Parker is endowed with amazing powers to fight crime." },
        { id: 299534, title: "Avengers: Endgame", desc: "After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to restore order to the universe." },
        { id: 210577, title: "Gone Girl", desc: "With his wife's disappearance having become the focus of an intense media circus, a man sees the spotlight turned on him when it's suspected that he may not be innocent." },
        { id: 109445, title: "Frozen", desc: "When the newly-crowned Queen Elsa accidentally uses her power to turn things into ice to curse her home in infinite winter, her sister Anna teams up with a mountain man to change the weather condition." },
        { id: 37724, title: "Skyfall", desc: "James Bond's loyalty to M is tested when her past comes back to haunt her. When MI6 comes under attack, 007 must track down and destroy the threat, no matter how personal the cost." },
        { id: 150540, title: "Inside Out", desc: "After young Riley is uprooted from her Midwest life and moved to San Francisco, her emotions - Joy, Fear, Anger, Disgust and Sadness - conflict on how best to navigate a new city, house, and school." },
        { id: 862, title: "Toy Story", desc: "A cowboy doll is profoundly threatened and jealous when a new spaceman figure supplants him as top toy in a boy's room." },
        { id: 49051, title: "The Hobbit: An Unexpected Journey", desc: "A reluctant Hobbit, Bilbo Baggins, sets out to the Lonely Mountain with a spirited group of dwarves to reclaim their mountain home from the dragon Smaug." },
        { id: 58, title: "Pirates of the Caribbean: Dead Man's Chest", desc: "Jack Sparrow races to recover the heart of Davy Jones to avoid enslaving his soul to Jones' service, while other friends and foes seek the heart for their own agenda as well." },
        { id: 98, title: "Gladiator", desc: "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery." },
        { id: 285, title: "Pirates of the Caribbean: At World's End", desc: "Captain Barbossa, Will Turner and Elizabeth Swann must sail off the edge of the map, navigate treachery and betrayal, find Jack Sparrow, and make their final alliances for one last decisive battle." },
        { id: 121, title: "The Lord of the Rings: The Two Towers", desc: "While Frodo and Sam edge closer to Mordor with the help of the shifty Gollum, the divided fellowship makes a stand against Sauron's new ally, Saruman, and his hordes of Isengard." }
    ];

    console.log("🚀 Starting Knowledge Base Seed...");
    
    for (const m of movies) {
        try {
            console.log(`📡 Generating embedding for: ${m.title}...`);
            const res = await hf.featureExtraction({
                model: "sentence-transformers/all-MiniLM-L6-v2",
                inputs: m.desc,
            });
            
            const { error } = await supabase.from('reviews').upsert({
                user_id: 'bot_knowledge_base',
                movie_id: m.id,
                rating: 5,
                content: "Highly recommended by the system.",
                embedding: res,
                created_at: new Date().toISOString()
            }, { onConflict: 'user_id,movie_id' });

            if (error) {
                console.error(`❌ Error seeding ${m.title}:`, error.message);
            } else {
                console.log(`✅ Successfully added ${m.title} to Knowledge Base.`);
            }
        } catch (e) {
            console.error(`💥 Critical failure for ${m.title}:`, e.message);
        }
    }
    console.log("✨ Seeding Complete! Now go rate a similar movie to see the magic.");
}

seed();
