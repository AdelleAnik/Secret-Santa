export default function Snow({ count = 40 }) {
  // create "count" flakes with random positions / durations
  const flakes = Array.from({ length: count }).map((_, i) => {
    const left = Math.random() * 100; // vw
    const size = 4 + Math.random() * 6; // px
    const delay = Math.random() * 6; // s
    const dur = 7 + Math.random() * 8; // s
    const blur = Math.random() * 2;

    return (
      <i
        key={i}
        style={{
          left: `${left}vw`,
          width: size,
          height: size,
          filter: `blur(${blur}px)`,
          animationDuration: `${dur}s`,
          animationDelay: `${delay}s`,
        }}
      />
    );
  });

  return <div className="snow">{flakes}</div>;
}
