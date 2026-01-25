import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { createList } from "@/app/list-actions";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function ListsPage() {
    const { userId } = await auth();
    if (!userId) return <div>Please sign in</div>;

    const { data: lists } = await supabase
        .from("movie_lists")
        .select("*")
        .eq("user_id", userId);

    return (
        <main className="min-h-screen">
            <Navbar />
            <div className="content-container">
                <div className="header-row">
                    <h1 className="page-title">My <span className="gradient-text">Movie Lists</span></h1>

                    <div className="create-box glass">
                        <h3>Create New List</h3>
                        <form action={async (formData) => {
                            "use server";
                            const name = formData.get("name") as string;
                            const desc = formData.get("desc") as string;
                            await createList(name, desc);
                        }}>
                            <input name="name" placeholder="List Name" required />
                            <input name="desc" placeholder="Description (optional)" />
                            <button type="submit"><Plus size={18} /> Create</button>
                        </form>
                    </div>
                </div>

                <div className="lists-grid">
                    {lists?.map((list: any) => (
                        <div key={list.id} className="list-card glass">
                            <h2>{list.name}</h2>
                            <p>{list.description}</p>
                            <span className="movie-count">{list.movies?.length || 0} movies</span>
                        </div>
                    ))}
                    {lists?.length === 0 && <p className="empty">No lists created yet.</p>}
                </div>
            </div>

            <style jsx>{`
        .content-container {
          max-width: 1200px;
          margin: 120px auto 0;
          padding: 0 40px;
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 60px;
          gap: 40px;
        }
        .page-title {
          font-size: 3rem;
          flex: 1;
        }
        .create-box {
          padding: 24px;
          width: 350px;
        }
        .create-box h3 { margin-bottom: 16px; font-size: 1.1rem; }
        .create-box form { display: flex; flex-direction: column; gap: 12px; }
        .create-box input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: 8px;
          padding: 10px;
          color: white;
        }
        .create-box button {
          background: var(--primary-gradient);
          color: white;
          padding: 10px;
          border-radius: 8px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .lists-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }
        .list-card {
          padding: 24px;
          transition: transform 0.3s ease;
          cursor: pointer;
        }
        .list-card:hover { transform: translateY(-5px); border-color: var(--accent-color); }
        .list-card h2 { margin-bottom: 8px; }
        .list-card p { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 20px; }
        .movie-count {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--accent-color);
        }
        @media (max-width: 900px) {
          .header-row { flex-direction: column; }
          .create-box { width: 100%; }
        }
      `}</style>
        </main>
    );
}
