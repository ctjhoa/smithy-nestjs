// Port of
// https://github.com/smithy-lang/smithy/blob/84d3ccbd2009e22686e5f8503b1c265dfe0f46ae/smithy-model/src/main/java/software/amazon/smithy/model/pattern/SmithyPattern.java#L198

export enum SegmentType {
  LITERAL,
  LABEL,
  GREEDY_LABEL,
}

/**
 * Segment within a SmithyPattern.
 */
export class Segment {
  private asString: string;
  private content: string;
  private segmentType: SegmentType;

  constructor(content: string, segmentType: SegmentType, offset: number) {
    this.content = content;
    this.segmentType = segmentType;

    this.checkForInvalidContents(offset);

    if (segmentType == SegmentType.GREEDY_LABEL) {
      this.asString = `{${content}}`;
    } else if (segmentType == SegmentType.LABEL) {
      this.asString = `{${content}}`;
    } else {
      this.asString = content;
    }
  }
  private checkForInvalidContents(offset: number): void {
    let offsetString = '';
    if (offset != null) {
      offsetString += ' at index ' + offset;
    }
    if (this.segmentType == SegmentType.LITERAL) {
      if (this.content.length === 0) {
        throw new InvalidPatternException(
          'Segments must not be empty' + offsetString
        );
      } else if (this.content.includes('{') || this.content.includes('}')) {
        throw new InvalidPatternException(
          'Literal segments must not contain `{` or `}` characters. Found segment `' +
            this.content +
            '`' +
            offsetString
        );
      }
    } else if (this.content.length === 0) {
      throw new InvalidPatternException(
        'Empty label declaration in pattern' + offsetString + '.'
      );
    } /* else if (!ShapeId.isValidIdentifier(this.content)) {
      throw new InvalidPatternException(
        "Invalid label name in pattern: '" +
          this.content +
          "'" +
          offsetString +
          '. Labels must contain value identifiers.'
      );
    } */
  }

  /**
   * Parse a segment from the given offset.
   *
   * @param content Content of the segment.
   * @param offset Character offset where the segment starts in the containing pattern.
   * @return Returns the created segment.
   * @throws InvalidPatternException if the segment is invalid.
   */
  static parse(content: string, offset: number): Segment {
    if (
      content.length >= 2 &&
      content.charAt(0) == '{' &&
      content.charAt(content.length - 1) == '}'
    ) {
      const labelType =
        content.charAt(content.length - 2) == '+'
          ? SegmentType.GREEDY_LABEL
          : SegmentType.LABEL;
      content =
        labelType == SegmentType.GREEDY_LABEL
          ? content.substring(1, content.length - 2)
          : content.substring(1, content.length - 1);
      return new Segment(content, labelType, offset);
    } else {
      return new Segment(content, SegmentType.LITERAL, offset);
    }
  }

  /**
   * Get the content of the segment.
   *
   * <p>The return value contains the segment in its entirety for
   * non-labels, and the label name for both labels and greedy labels.
   * For example, given a segment of "{label+}", the return value of
   * getContent would be "label".
   *
   * @return Content of the segment.
   */
  getContent(): string {
    return this.content;
  }

  /**
   * @return True if the segment is a non-label literal.
   */
  isLiteral(): boolean {
    return this.segmentType == SegmentType.LITERAL;
  }

  /**
   * @return True if the segment is a label regardless of whether is greedy or not.
   */
  isLabel(): boolean {
    return this.segmentType != SegmentType.LITERAL;
  }

  /**
   * @return True if the segment is a non-greedy label.
   */
  isNonGreedyLabel(): boolean {
    return this.segmentType == SegmentType.LABEL;
  }

  /**
   * @return True if the segment is a greedy label.
   */
  isGreedyLabel(): boolean {
    return this.segmentType == SegmentType.GREEDY_LABEL;
  }

  /**
   * Get the segment as a literal value to be used in a pattern.
   *
   * <p>Unlike the result of {@link #getContent}, the return value
   * of {@code toString} includes braces for labels and "+" for
   * greedy labels.
   *
   * @return The literal segment.
   */
  toString(): string {
    return this.asString;
  }
}

/**
 * Exception thrown for invalid URI patterns.
 */
class InvalidPatternException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPatternException';
  }
}
