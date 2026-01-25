async function test() {
    try {
        console.log("Testing AI Search...");
        const res = await fetch("http://localhost:3000/api/ai/mood", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: "heart wrenching movie about parents children" }),
        });
        const text = await res.text();
        console.log("Status:", res.status);
        try {
            const data = JSON.parse(text);
            if (data.error) {
                console.error("API Error:", data.error);
            } else {
                console.log("Found:", data.results?.length, "movies");
            }
        } catch (e) {
            console.error("Non-JSON response:", text);
        }
    } catch (e) {
        console.error("Test Failed:", e.message);
    }
}

test();
