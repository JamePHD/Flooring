export default function Header() {
  return(
    <header style={{ padding: "16px", background: "blue", color: "white" }}>
      <h1>Empirical Solutions</h1>

      <nav style={{ marginTop: "10px" }}>
        <a href="#" style={{ marginRight: "10px", color: "white" }}>Home</a>
        <a href="#" style={{ marginRight: "10px", color: "white" }}>Comparison</a>
      </nav>
    </header>
  );
}