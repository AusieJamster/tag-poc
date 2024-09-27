import gremlin from "gremlin";
import { v4 as uuidv4 } from "uuid";
import { ConsoleName } from "./consoleName";

type TGraphSource =
  gremlin.process.GraphTraversalSource<gremlin.process.GraphTraversal>;

class GremlinPoc {
  private g: TGraphSource | null = null;

  constructor() {
    this.main();
  }

  async main() {
    this.g = await this.connect();

    if (!this.g) {
      console.error("Unable to establish connection:", this.g);
      return;
    }

    const personId = uuidv4();
    const movieId = uuidv4();
    try {
      await this.createPersonVertex(personId);
      await this.createMovieVertex(movieId);
      await this.createEdge(personId, movieId);
      await this.createMultiple();
      await this.readVertex();
      await this.readConnections(personId);
    } catch (exception) {
      console.error("\u001b[1;31m", "Exception", "\u001b[0m", exception);
    }
  }

  @ConsoleName()
  async connect() {
    const conn = new gremlin.driver.DriverRemoteConnection(
      "wss://localhost:8182"
    );
    const { traversal } = gremlin.process.AnonymousTraversalSource;
    return traversal().withRemote(conn);
  }

  @ConsoleName()
  async createPersonVertex(personId: string) {
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
  async createMovieVertex(movieId: string) {
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
  async createEdge(personId: string, movieId: string) {
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
        .property(t.id, uuidv4())
        .property("email", "user@domain.com")
        .property(single, "firstname", "firstname")
        .property(single, "lastname", "lastname")
        .as("user")
        // ---
        .addV("movie")
        .property(t.id, uuidv4())
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
  async readVertex() {
    const { t } = gremlin.process;

    const data = await this.g
      ?.V()
      .hasLabel("movie")
      .valueMap(true)
      .limit(10)
      .toList();

    console.log("\n");
    console.log("id|label|title");

    return data?.map(
      (item: any) =>
        item.get(t.id) + "|" + item.get(t.label) + "|" + item.get("title")
    );
  }

  @ConsoleName()
  async readConnections(personId: string) {
    const { statics: __ } = gremlin.process;

    const getPersonPromise = await this.g
      ?.V(personId)
      .project("personid", "movies")
      .by("email")
      .by(__.out("watched").valueMap("title").fold())
      .limit(10)
      .toList();
    console.log("\n");
    console.log("Email".padEnd(20, " ") + "Title".padEnd(20, " "));
    console.log("".padEnd(50, "_"));

    return getPersonPromise?.map(
      (item: any) =>
        item.get("personid").padEnd(20, " ") +
        item.get("movies")[0].get("title")
    );
  }
}

new GremlinPoc();
