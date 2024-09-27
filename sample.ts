import gremlin from "gremlin";
import { ConsoleName } from "./consoleName";

type TGraphSource =
  gremlin.process.GraphTraversalSource<gremlin.process.GraphTraversal>;

class GremlinPoc {
  private g: TGraphSource | null = null;

  constructor() {
    this.g = this.connect();
    this.main();
  }

  async main() {
    if (!this.g) {
      console.error("Unable to establish connection:", this.g);
      return;
    }

    const personId = uuidv1();
    const movieId = uuidv1();
    try {
      await this.createPersonVertex(personId);
      await this.createMovieVertex(movieId);
      await this.createEdge(personId, movieId);
      await this.createMultiple();
      await this.readVertices();
      await this.readConnections(personId);
    } catch (exception) {
      console.error("\u001b[1;31m", "Exception", "\u001b[0m", exception);
    }
  }

  connect() {
    console.log("\u001b[1;32m", "Running connect...", "\u001b[0m");

    const conn = new gremlin.driver.DriverRemoteConnection(
      "ws://localhost:8182/gremlin"
    );

    console.log("\u001b[1;33m", "End connect...", "\u001b[0m");
    return gremlin.process.AnonymousTraversalSource.traversal().withRemote(
      conn
    );
  }

  @ConsoleName()
  async createPersonVertex(personId: number) {
    const {
      cardinality: { single },
      t,
    } = gremlin.process;

    return this.g
      ?.addV("person")
      .property(t.id, personId)
      .property("email", "user@domain.com")
      .property(single, "firstname", "firstname")
      .property(single, "lastname", "lastname")
      .next();
  }

  @ConsoleName()
  async createMovieVertex(movieId: number) {
    const {
      cardinality: { single },
      t,
    } = gremlin.process;

    return this.g
      ?.addV("movie")
      .property(t.id, movieId)
      .property(single, "title", "movietitle")
      .next();
  }

  @ConsoleName()
  async createEdge(personId: number, movieId: number) {
    const { statics: __ } = gremlin.process;

    return this.g
      ?.addE("watched")
      .from_(__.V(personId))
      .to(__.V(movieId))
      .next();
  }

  @ConsoleName()
  async createMultiple() {
    const {
      cardinality: { single },
      t,
    } = gremlin.process;

    return (
      this.g
        ?.addV("person")
        .property(t.id, uuidv1())
        .property("email", "user@domain.com")
        .property(single, "firstname", "firstname")
        .property(single, "lastname", "lastname")
        .as("user")
        // ---
        .addV("movie")
        .property(t.id, uuidv1())
        .property(single, "title", "movietitle")
        .as("movie")
        // ---
        .addE("watched")
        .from_("user")
        .to("movie")
        .next()
    );
  }

  @ConsoleName()
  async readVertices() {
    const { t } = gremlin.process;

    const data = await this.g
      ?.V()
      .hasLabel("movie")
      .valueMap(true)
      .limit(10)
      .toList();

    return data?.map((item: any) => ({
      id: item.get(t.id),
      label: item.get(t.label),
      title: item.get("title").join("|"),
    }));
  }

  @ConsoleName()
  async readConnections(personId: number) {
    const { statics: __ } = gremlin.process;

    const getPersonPromise = await this.g
      ?.V(personId)
      .project("personid", "movies")
      .by("email")
      .by(__.out("watched").valueMap("title").fold())
      .limit(10)
      .toList();

    return getPersonPromise?.map((item: any) => ({
      email: item.get("personid"),
      "movie.title": item.get("movies")[0].get("title").join(" & "),
    }));
  }
}

new GremlinPoc();

function uuidv1() {
  return Math.ceil(Math.random() * 1000000);
}
