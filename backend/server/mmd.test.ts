import { describe, it, expect, vi } from 'vitest';
import { generateMmdFromGraphData } from './mmd';
import { appRouter } from './routers';
import * as db from './db';

// Mock the db module
vi.mock('./db');

describe('MMD Export', () => {
  it('should generate a valid Mermaid Markdown string from graph data', () => {
    const sampleGraphData = {
      nodes: [
        { id: 1, name: 'Service A', uniqueId: 'service-a', type: 'Service' },
        { id: 2, name: 'API B', uniqueId: 'api-b', type: 'API' },
        { id: 3, name: 'Component C', uniqueId: 'comp-c', type: 'Component' },
        { id: 4, name: 'Page D', uniqueId: 'page-d', type: 'Page' },
      ],
      edges: [
        { sourceId: 1, targetId: 2, type: 'EXPOSES_API' },
        { sourceId: 4, targetId: 3, type: 'USES_COMPONENT' },
        { sourceId: 1, targetId: 3, type: 'DEPENDS_ON' },
      ],
    };

    const mmd = generateMmdFromGraphData(sampleGraphData);

    expect(mmd).toContain('```mermaid');
    expect(mmd).toContain('graph TD');
    // Node definitions
    expect(mmd).toContain('1(("Service A"))'); // Service -> Circle
    expect(mmd).toContain('2{"API B"}');       // API -> Rhombus
    expect(mmd).toContain('3["Component C"]'); // Component -> Rectangle
    expect(mmd).toContain('4["Page D"]');       // Page -> Rectangle

    // Edge definitions
    expect(mmd).toContain('1 -->|EXPOSES_API| 2');
    expect(mmd).toContain('4 -->|USES_COMPONENT| 3');
    expect(mmd).toContain('1 -->|DEPENDS_ON| 3');
    expect(mmd).toContain('```');
  });

  it('should handle nodes with special characters in names', () => {
    const sampleGraphData = {
      nodes: [
        { id: 1, name: 'Service with "quotes"', uniqueId: 'service-q', type: 'Service' },
      ],
      edges: [],
    };

    const mmd = generateMmdFromGraphData(sampleGraphData);
    expect(mmd).toContain('1(("Service with #quot;quotes#quot;"))');
  });

  it('should handle empty graph data', () => {
    const mmd = generateMmdFromGraphData({ nodes: [], edges: [] });
    expect(mmd).toBe('```mermaid\ngraph TD\n```');
  });

  it('should correctly call getGraphData and generate MMD via tRPC router', async () => {
    const caller = appRouter.createCaller({} as any); // Context is not used in this path

    const sampleGraphData = {
      nodes: [{ id: 1, name: 'Test Node', uniqueId: 'test-1', type: 'Service' }],
      edges: [],
    };

    // Mock the implementation of getGraphData
    vi.mocked(db.getGraphData).mockResolvedValue(sampleGraphData);

    const result = await caller.graph.exportMmd({});

    // Verify that getGraphData was called
    expect(db.getGraphData).toHaveBeenCalled();
    // Verify the output
    expect(result).toContain('```mermaid');
    expect(result).toContain('1(("Test Node"))');
  });
});
