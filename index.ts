import gremlin from "gremlin";
import { ConsoleName } from "./consoleName";

type TGraphSource =
  gremlin.process.GraphTraversalSource<gremlin.process.GraphTraversal>;

enum VertexType {
  STAY_ID = "stay-id",
  STAY_NAME = "stay-name",
  STAY_CHAIN = "stay-chain",
  DESTINATION = "destination",
}
type TVertexType = VertexType[keyof VertexType];

enum EdgeType {
  RELATES = "relates",
}
type TEdgeType = EdgeType[keyof EdgeType];

interface IVertex {
  id: number;
  label: string;
  properties: Record<string, string>;
}

class GremlinPoc {
  private g: TGraphSource;

  constructor() {
    this.g = this.connect();

    this.main();
  }

  async main() {
    await this.importObject({
      id: "10084",
      title: "Renaissance Minneapolis Bloomington Hotel",
      chain: "Marriott",
      destination: "us-mn-richfield",
    });
    await this.getHotelById("10084");
    await this.getHotelsByChain("Marriott");
    await this.getAllNodes();
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
  async createVertex(
    type: TVertexType,
    id: string,
    properties: Record<string, string> = {}
  ) {
    const {
      cardinality: { single },
      t,
    } = gremlin.process;

    const traverse = this.g.addV(type).property("id", id);

    Object.entries(properties).forEach(([key, value]) => {
      traverse.property(single, key, value);
    });

    return traverse.next();
  }

  @ConsoleName()
  async createEdge(fromId: string, toId: string) {
    const { statics } = gremlin.process;

    return this.g
      .addE(EdgeType.RELATES)
      .from_(statics.V(fromId))
      .to(statics.V(toId))
      .next();
  }

  @ConsoleName()
  async importObject(obj: {
    id: string;
    title: string;
    destination: string;
    chain: string;
  }) {
    const {
      cardinality: { single },
      t,
    } = gremlin.process;

    return (
      this.g
        //  Vertices
        .addV(VertexType.STAY_ID)
        .property("id", obj.id)
        .property("title", obj.title)
        .as("STAY_ID")

        .addV(VertexType.STAY_CHAIN)
        .property("chain", obj.chain)
        .as("STAY_CHAIN")

        .addV(VertexType.DESTINATION)
        .property("destination", obj.destination)
        .as("DESTINATION")

        //  Edges
        .addE(EdgeType.RELATES)
        .from_("STAY_CHAIN")
        .to("STAY_ID")

        .addE(EdgeType.RELATES)
        .from_("DESTINATION")
        .to("STAY_ID")
        .next()
    );
  }

  @ConsoleName()
  async getHotelById(id: string) {
    const { statics: __, t } = gremlin.process;
    const stayById = (await this.g
      .V()
      .has("id", id)
      .project("id", "title")
      .by("id")
      .by("title")
      .limit(1)
      .next()) as { value: Map<string, string> };

    return { id: stayById.value.get("id"), title: stayById.value.get("title") };
  }

  @ConsoleName()
  async getAllNodes(type?: TVertexType) {
    const { statics: __ } = gremlin.process;
    const vertices = this.g.V();
    if (type) vertices.hasLabel(type);

    const result = (await vertices.toList()) as IVertex[];

    return result;
  }

  @ConsoleName()
  async getHotelsByChain(chain: string, limit = 10) {
    const { statics: __ } = gremlin.process;
    const staysByChain = (await this.g
      .V()
      .hasLabel(VertexType.STAY_CHAIN)
      .has("chain", chain)
      .project("id", "title")
      .by(__.out(EdgeType.RELATES).has("id").limit(1).values("id"))
      .by(__.out(EdgeType.RELATES).has("title").limit(1).values("title"))
      .limit(limit)
      .toList()) as Map<string, string>[];

    return staysByChain.map((item) => ({
      id: item.get("id"),
      title: item.get("title"),
    }));
  }
}

new GremlinPoc();
