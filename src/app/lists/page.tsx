import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { createList } from "@/app/list-actions";
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
      <div className="page-container">
        <div className="lists-header">
          <h1 className="hero-title" style={{ textAlign: 'left', fontSize: '3rem', flex: 1 }}>
            My <span className="gradient-text">Movie Lists</span>
          </h1>

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

        <div className="movie-grid">
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
    </main>
  );
}
