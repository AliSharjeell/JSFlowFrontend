import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

interface MarkdownRendererProps {
    children: string;
}

interface ParsedBlock {
    type: 'heading' | 'bullet' | 'ordered' | 'code_block' | 'blockquote' | 'hr' | 'paragraph';
    content: string;
    level?: number; // heading level or list nesting
    index?: number; // ordered list index
}

function parseBlocks(text: string): ParsedBlock[] {
    const lines = text.split('\n');
    const blocks: ParsedBlock[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

        // Code block (fenced)
        if (line.trimStart().startsWith('```')) {
            const codeLines: string[] = [];
            i++;
            while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            i++; // skip closing ```
            blocks.push({ type: 'code_block', content: codeLines.join('\n') });
            continue;
        }

        // Horizontal rule
        if (/^(\s*[-*_]\s*){3,}$/.test(line)) {
            blocks.push({ type: 'hr', content: '' });
            i++;
            continue;
        }

        // Heading
        const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
        if (headingMatch) {
            blocks.push({ type: 'heading', level: headingMatch[1].length, content: headingMatch[2].trim() });
            i++;
            continue;
        }

        // Bullet list item
        const bulletMatch = line.match(/^(\s*)[-*+]\s+(.+)/);
        if (bulletMatch) {
            blocks.push({ type: 'bullet', content: bulletMatch[2].trim() });
            i++;
            continue;
        }

        // Ordered list item
        const orderedMatch = line.match(/^(\s*)(\d+)[.)]\s+(.+)/);
        if (orderedMatch) {
            blocks.push({ type: 'ordered', index: parseInt(orderedMatch[2], 10), content: orderedMatch[3].trim() });
            i++;
            continue;
        }

        // Blockquote
        const quoteMatch = line.match(/^>\s*(.*)/);
        if (quoteMatch) {
            const quoteLines: string[] = [quoteMatch[1]];
            i++;
            while (i < lines.length && lines[i].startsWith('>')) {
                quoteLines.push(lines[i].replace(/^>\s?/, ''));
                i++;
            }
            blocks.push({ type: 'blockquote', content: quoteLines.join('\n') });
            continue;
        }

        // Empty line — skip
        if (line.trim() === '') {
            i++;
            continue;
        }

        // Paragraph — collect consecutive non-empty, non-special lines
        const paraLines: string[] = [line];
        i++;
        while (
            i < lines.length &&
            lines[i].trim() !== '' &&
            !lines[i].trimStart().startsWith('```') &&
            !lines[i].match(/^#{1,3}\s/) &&
            !lines[i].match(/^\s*[-*+]\s/) &&
            !lines[i].match(/^\s*\d+[.)]\s/) &&
            !lines[i].startsWith('>')
        ) {
            paraLines.push(lines[i]);
            i++;
        }
        blocks.push({ type: 'paragraph', content: paraLines.join(' ') });
    }

    return blocks;
}

/** Renders inline markdown: **bold**, *italic*, `code`, ~~strike~~ */
function renderInline(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];
    // Regex matches: **bold**, *italic*, `code`, ~~strike~~
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|~~(.+?)~~)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        // Push text before this match
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }

        if (match[2]) {
            // **bold**
            parts.push(
                <Text key={`b-${match.index}`} style={inlineStyles.bold}>{match[2]}</Text>
            );
        } else if (match[3]) {
            // *italic*
            parts.push(
                <Text key={`i-${match.index}`} style={inlineStyles.italic}>{match[3]}</Text>
            );
        } else if (match[4]) {
            // `code`
            parts.push(
                <Text key={`c-${match.index}`} style={inlineStyles.code}>{match[4]}</Text>
            );
        } else if (match[5]) {
            // ~~strike~~
            parts.push(
                <Text key={`s-${match.index}`} style={inlineStyles.strike}>{match[5]}</Text>
            );
        }

        lastIndex = match.index + match[0].length;
    }

    // Push remaining text
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ children }) => {
    const blocks = parseBlocks(children);

    return (
        <View style={styles.container}>
            {blocks.map((block, idx) => {
                switch (block.type) {
                    case 'heading': {
                        const headingStyle =
                            block.level === 1 ? styles.h1
                                : block.level === 2 ? styles.h2
                                    : styles.h3;
                        return (
                            <Text key={idx} style={headingStyle}>
                                {renderInline(block.content)}
                            </Text>
                        );
                    }

                    case 'bullet':
                        return (
                            <View key={idx} style={styles.listItem}>
                                <Text style={styles.bullet}>•</Text>
                                <Text style={styles.listText}>{renderInline(block.content)}</Text>
                            </View>
                        );

                    case 'ordered':
                        return (
                            <View key={idx} style={styles.listItem}>
                                <Text style={styles.orderedNum}>{block.index}.</Text>
                                <Text style={styles.listText}>{renderInline(block.content)}</Text>
                            </View>
                        );

                    case 'code_block':
                        return (
                            <View key={idx} style={styles.codeBlock}>
                                <Text style={styles.codeBlockText}>{block.content}</Text>
                            </View>
                        );

                    case 'blockquote':
                        return (
                            <View key={idx} style={styles.blockquote}>
                                <Text style={styles.blockquoteText}>{renderInline(block.content)}</Text>
                            </View>
                        );

                    case 'hr':
                        return <View key={idx} style={styles.hr} />;

                    case 'paragraph':
                    default:
                        return (
                            <Text key={idx} style={styles.paragraph}>
                                {renderInline(block.content)}
                            </Text>
                        );
                }
            })}
        </View>
    );
};

const monoFont = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

const inlineStyles = StyleSheet.create({
    bold: {
        fontFamily: Fonts.bold,
    },
    italic: {
        fontStyle: 'italic',
    },
    code: {
        backgroundColor: '#EBF3FF',
        color: Colors.primary,
        fontFamily: monoFont,
        fontSize: 13,
        paddingHorizontal: 4,
        borderRadius: 4,
    },
    strike: {
        textDecorationLine: 'line-through',
        color: Colors.textSecondary,
    },
});

const styles = StyleSheet.create({
    container: {
        gap: 4,
    },
    paragraph: {
        fontFamily: Fonts.regular,
        fontSize: 15,
        lineHeight: 22,
        color: Colors.text,
    },
    h1: {
        fontFamily: Fonts.bold,
        fontSize: 18,
        lineHeight: 24,
        color: Colors.text,
        marginTop: 6,
        marginBottom: 2,
    },
    h2: {
        fontFamily: Fonts.bold,
        fontSize: 17,
        lineHeight: 23,
        color: Colors.text,
        marginTop: 4,
        marginBottom: 2,
    },
    h3: {
        fontFamily: Fonts.semiBold,
        fontSize: 16,
        lineHeight: 22,
        color: Colors.text,
        marginTop: 2,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        paddingLeft: 4,
    },
    bullet: {
        fontFamily: Fonts.regular,
        fontSize: 15,
        lineHeight: 22,
        color: Colors.primary,
        width: 14,
    },
    orderedNum: {
        fontFamily: Fonts.semiBold,
        fontSize: 14,
        lineHeight: 22,
        color: Colors.primary,
        width: 20,
    },
    listText: {
        fontFamily: Fonts.regular,
        fontSize: 15,
        lineHeight: 22,
        color: Colors.text,
        flex: 1,
    },
    codeBlock: {
        backgroundColor: '#F5F7FA',
        borderRadius: 10,
        padding: 12,
        marginVertical: 4,
    },
    codeBlockText: {
        fontFamily: monoFont,
        fontSize: 13,
        lineHeight: 19,
        color: Colors.text,
    },
    blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary,
        backgroundColor: '#EBF3FF',
        borderRadius: 4,
        paddingLeft: 12,
        paddingVertical: 6,
        paddingRight: 8,
        marginVertical: 4,
    },
    blockquoteText: {
        fontFamily: Fonts.regular,
        fontSize: 14,
        lineHeight: 20,
        color: Colors.text,
        fontStyle: 'italic',
    },
    hr: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 8,
    },
});
