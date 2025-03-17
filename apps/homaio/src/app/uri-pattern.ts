// Port of
// https://github.com/smithy-lang/smithy/blob/84d3ccbd2009e22686e5f8503b1c265dfe0f46ae/smithy-model/src/main/java/software/amazon/smithy/model/pattern/SmithyPattern.java#L36

import { Segment } from './segment';

/**
 * Represents a URI pattern.
 *
 * A URI pattern is an absolute path segment used to route to operations.
 * The pattern must start with "/", must not contain empty segments
 * (i.e., "//"), must not contain a fragment (i.e., "#"), and must not
 * end with "?".
 *
 * Labels may appear in the pattern in the form of "{label}". Labels must
 * not be repeated, must make up an entire path segment (e.g., "/{foo}/baz"),
 * and the label name must match the regex "^[a-zA-Z0-9_]+$". No labels can
 * appear after the query string.
 *
 * Greedy labels, a specialized type of label, may be specified using
 * "{label+}". Only a single greedy label may appear in a pattern, and it
 * must be the last label in a pattern.
 */
export class UriPattern {
  private pattern: string;
  private segments: Segment[];
  private readonly queryLiterals: Map<string, string>;

  private constructor(
    pattern,
    segments: Segment[],
    queryLiterals: Map<string, string>
  ) {
    this.pattern = pattern;
    this.segments = segments;
    this.queryLiterals = queryLiterals;
  }

  /**
   * Parse a URI pattern string into a UriPattern.
   *
   * The provided value must match the origin-form request-target
   * grammar production in RFC 9112, section 3.2.1.
   *
   * @param uri URI pattern to parse.
   * @returns The parsed URI pattern.
   * @throws InvalidUriPatternException for invalid URI patterns.
   * @see https://tools.ietf.org/html/rfc9112#section-3.2.1
   */
  public static parse(uri: string): UriPattern {
    if (uri.endsWith('?')) {
      throw new InvalidUriPatternException(
        `URI patterns must not end with '?'. Found ${uri}`
      );
    } else if (!uri.startsWith('/')) {
      throw new InvalidUriPatternException(
        `URI pattern must start with '/'. Found ${uri}`
      );
    } else if (uri.includes('#')) {
      throw new InvalidUriPatternException(
        `URI pattern must not contain a fragment. Found ${uri}`
      );
    }

    const parts = uri.split('?', 2);
    const unparsedSegments = parts[0].split('/');
    const segments: Segment[] = [];
    // Skip the first "/" segment, and thus assume offset of 1.
    let offset = 1;
    for (let i = 1; i < unparsedSegments.length; i++) {
      const segment = unparsedSegments[i];
      segments.push(Segment.parse(segment, offset));
      // Add one to account for `/`
      offset += segment.length + 1;
    }

    const queryLiterals = new Map<string, string>();
    // Parse the query literals outside of the general pattern
    if (parts.length === 2) {
      if (parts[1].includes('{') || parts[1].includes('}')) {
        throw new InvalidUriPatternException(
          `URI labels must not appear in the query string. Found ${uri}`
        );
      }
      for (const kvp of parts[1].split('&')) {
        const parameterParts = kvp.split('=', 2);
        const actualKey = parameterParts[0];
        if (queryLiterals.has(actualKey)) {
          throw new InvalidUriPatternException(
            `Literal query parameters must not be repeated: ${uri}`
          );
        }
        queryLiterals.set(
          actualKey,
          parameterParts.length === 2 ? parameterParts[1] : ''
        );
      }
    }

    return new UriPattern(uri, segments, queryLiterals);
  }

  /**
   * Gets all segments, in order.
   *
   * @return All segments, in order, in an unmodifiable list.
   */
  getSegments(): Segment[] {
    return [...this.segments];
  }

  /**
   * Get a list of all segments that are labels.
   *
   * @return Label segments in an unmodifiable list.
   */
  getLabels(): Segment[] {
    return [...this.segments.filter((s) => s.isLabel())];
  }

  /**
   * Get a label by case-insensitive name.
   *
   * @param name Name of the label to retrieve.
   * @return An optionally found label.
   */
  getLabel(name: string): Segment | undefined {
    const searchKey = name.toLowerCase();
    return this.segments
      .filter((s) => s.isLabel())
      .find((label) => label.getContent().toLowerCase() === searchKey);
  }

  /**
   * Gets the greedy label of the pattern, if present.
   *
   * @return Returns the optionally found segment that is a greedy label.
   */
  getGreedyLabel(): Segment | undefined {
    return this.segments.find((s) => s.isGreedyLabel());
  }

  /**
   * Get a readonly map of query string literal key-value pairs.
   *
   * @returns A readonly map of parsed query string literals.
   */
  public getQueryLiterals(): ReadonlyMap<string, string> {
    return this.queryLiterals;
  }

  /**
   * Gets a specific query string literal parameter value.
   *
   * @param parameter Case-sensitive name of the parameter to retrieve.
   * @returns The optionally found parameter value.
   */
  public getQueryLiteralValue(parameter: string): string | undefined {
    return this.queryLiterals.get(parameter);
  }

  equals(other: unknown): boolean {
    if (!(other instanceof UriPattern)) {
      return false;
    }

    const otherPattern = other as UriPattern;
    return mapsEqual(this.queryLiterals, otherPattern.queryLiterals);
  }
}

/**
 * Helper function to compare two maps for equality
 */
function mapsEqual<K, V>(map1: Map<K, V>, map2: Map<K, V>): boolean {
  if (map1.size !== map2.size) return false;

  for (const [key, val] of map1) {
    if (!map2.has(key) || map2.get(key) !== val) {
      return false;
    }
  }

  return true;
}

/**
 * Exception thrown for invalid URI patterns.
 */
class InvalidUriPatternException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidUriPatternException';
  }
}
