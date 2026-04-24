import { Link } from "react-router";
import { motion } from "motion/react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { ScoreRing } from "../components/ScoreRing";
import { SkillPill } from "../components/SkillPill";
import { ArrowLeft, Check, X } from "lucide-react";

export default function DesignSystem() {
  const colors = [
    { name: "Deep Navy/Dark Ink", hex: "#0D0D0D", usage: "Dashboard backgrounds" },
    { name: "Warm Off-White", hex: "#FAF8F4", usage: "Candidate-facing screens" },
    { name: "Gold Accent", hex: "#C9A84C", usage: "Highlights, scores, CTAs" },
    { name: "Muted Gray", hex: "#6B6B6B", usage: "Body text" },
    { name: "Secondary", hex: "#F5F3EF", usage: "Backgrounds, cards" },
    { name: "Border", hex: "#E5E3DE", usage: "Borders, dividers" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-['Playfair_Display'] font-bold">
              Resum<span className="text-accent">ify</span> Design System
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h2 className="text-4xl font-['Playfair_Display'] font-bold mb-4">
            Component Library & Design Tokens
          </h2>
          <p className="text-xl text-muted-foreground font-['DM_Sans']">
            A comprehensive design system for the Resumify platform
          </p>
        </motion.div>

        {/* Color Palette */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h3 className="text-3xl font-['Playfair_Display'] font-bold mb-6">Color Palette</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {colors.map((color, index) => (
              <motion.div
                key={color.hex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <Card className="p-6">
                  <div
                    className="w-full h-24 rounded-lg mb-4 border border-border"
                    style={{ backgroundColor: color.hex }}
                  />
                  <h4 className="font-['DM_Sans'] font-semibold mb-1">{color.name}</h4>
                  <p className="font-['DM_Mono'] text-sm text-muted-foreground mb-2">
                    {color.hex}
                  </p>
                  <p className="text-sm text-muted-foreground font-['DM_Sans']">
                    {color.usage}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Typography */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <h3 className="text-3xl font-['Playfair_Display'] font-bold mb-6">Typography</h3>
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground font-['DM_Mono'] mb-2">
                  font-family: 'Playfair Display' • Headings, Large Scores
                </p>
                <h1 className="text-5xl font-['Playfair_Display'] font-bold">
                  The quick brown fox jumps
                </h1>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-['DM_Mono'] mb-2">
                  font-family: 'DM Sans' • Body, Labels, UI Text
                </p>
                <p className="text-xl font-['DM_Sans']">
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-['DM_Mono'] mb-2">
                  font-family: 'DM Mono' • Tags, IDs, Metrics, Code
                </p>
                <p className="text-lg font-['DM_Mono']">
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-border">
              <h4 className="font-['DM_Sans'] font-semibold mb-4">Type Scale</h4>
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-muted-foreground font-['DM_Mono']">H1 • 3rem</span>
                  <h1 className="font-['Playfair_Display']">Heading 1</h1>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-['DM_Mono']">H2 • 2.5rem</span>
                  <h2 className="font-['Playfair_Display']">Heading 2</h2>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-['DM_Mono']">H3 • 2rem</span>
                  <h3 className="font-['Playfair_Display']">Heading 3</h3>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-['DM_Mono']">Body • 1rem</span>
                  <p className="font-['DM_Sans']">Body text for content and descriptions</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground font-['DM_Mono']">Caption • 0.875rem</span>
                  <p className="text-sm font-['DM_Sans']">Caption and helper text</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h3 className="text-3xl font-['Playfair_Display'] font-bold mb-6">Buttons</h3>
          <Card className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-['DM_Sans'] font-semibold mb-4">Variants</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground font-['DM_Mono'] mb-2">Primary</p>
                    <Button>Primary Button</Button>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-['DM_Mono'] mb-2">
                      Gold CTA (Accent)
                    </p>
                    <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                      Gold CTA Button
                    </Button>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-['DM_Mono'] mb-2">Secondary</p>
                    <Button variant="secondary">Secondary Button</Button>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-['DM_Mono'] mb-2">Outline</p>
                    <Button variant="outline">Outline Button</Button>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-['DM_Mono'] mb-2">Danger</p>
                    <Button variant="destructive">Danger Button</Button>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-['DM_Mono'] mb-2">Ghost</p>
                    <Button variant="ghost">Ghost Button</Button>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-['DM_Sans'] font-semibold mb-4">Sizes</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground font-['DM_Mono'] mb-2">Small</p>
                    <Button size="sm">Small Button</Button>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-['DM_Mono'] mb-2">Default</p>
                    <Button>Default Button</Button>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-['DM_Mono'] mb-2">Large</p>
                    <Button size="lg">Large Button</Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Form Elements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-12"
        >
          <h3 className="text-3xl font-['Playfair_Display'] font-bold mb-6">Form Elements</h3>
          <Card className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground font-['DM_Mono'] mb-2">Input</p>
                  <Input placeholder="Enter text..." />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-['DM_Mono'] mb-2">
                    Input (with value)
                  </p>
                  <Input value="Sample text" readOnly />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground font-['DM_Mono'] mb-2">Switch</p>
                  <div className="flex items-center gap-3">
                    <Switch />
                    <span className="font-['DM_Sans']">Toggle option</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Badges & Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <h3 className="text-3xl font-['Playfair_Display'] font-bold mb-6">
            Badges & Status Indicators
          </h3>
          <Card className="p-6">
            <div className="space-y-8">
              <div>
                <h4 className="font-['DM_Sans'] font-semibold mb-4">Status Badges</h4>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="default">Shortlisted</Badge>
                  <Badge variant="secondary">Pending</Badge>
                  <Badge variant="destructive">Rejected</Badge>
                  <Badge className="bg-accent text-accent-foreground">High Priority</Badge>
                  <Badge className="bg-green-100 text-green-800">Hired</Badge>
                </div>
              </div>

              <div>
                <h4 className="font-['DM_Sans'] font-semibold mb-4">Skill Pills</h4>
                <div className="flex flex-wrap gap-3">
                  <SkillPill skill="Python" variant="matched" />
                  <SkillPill skill="TensorFlow" variant="matched" />
                  <SkillPill skill="AWS" variant="neutral" />
                  <SkillPill skill="Docker" variant="neutral" />
                  <SkillPill skill="GCP" variant="missing" />
                  <SkillPill skill="Kubernetes" variant="missing" />
                </div>
                <div className="mt-4 text-sm font-['DM_Sans'] space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Matched (Green) - Candidate has this skill</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 bg-secondary rounded-full" />
                    <span>Neutral (Gray) - General skill tag</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-red-600" />
                    <span>Missing (Red) - Skill gap identified</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Score Rings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-12"
        >
          <h3 className="text-3xl font-['Playfair_Display'] font-bold mb-6">Score Rings</h3>
          <Card className="p-6">
            <div className="flex flex-wrap items-end gap-12 justify-center">
              <ScoreRing score={92} size="sm" label="Small" />
              <ScoreRing score={87} size="md" label="Medium" />
              <ScoreRing score={95} size="lg" label="Large" />
            </div>
            <p className="text-sm text-muted-foreground font-['DM_Sans'] text-center mt-8">
              Animated circular progress indicators for scores and metrics
            </p>
          </Card>
        </motion.div>

        {/* Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-12"
        >
          <h3 className="text-3xl font-['Playfair_Display'] font-bold mb-6">Card Components</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="text-xl font-['Playfair_Display'] font-semibold mb-2">
                Default Card
              </h4>
              <p className="text-sm text-muted-foreground font-['DM_Sans']">
                Cards use 12px border radius with subtle shadows. Perfect for grouping related
                content.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h4 className="text-xl font-['Playfair_Display'] font-semibold mb-2">
                Interactive Card
              </h4>
              <p className="text-sm text-muted-foreground font-['DM_Sans']">
                Hover me! Cards can have hover states with shadow transitions for interactive
                elements.
              </p>
            </Card>
          </div>
        </motion.div>

        {/* Design Principles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <h3 className="text-3xl font-['Playfair_Display'] font-bold mb-6">Design Principles</h3>
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h4 className="font-['DM_Sans'] font-semibold mb-2">Modern Editorial SaaS</h4>
                <p className="text-sm text-muted-foreground font-['DM_Sans']">
                  Clean, professional, data-rich interfaces that prioritize information clarity
                  and usability.
                </p>
              </div>
              <div>
                <h4 className="font-['DM_Sans'] font-semibold mb-2">Intentional Color Usage</h4>
                <p className="text-sm text-muted-foreground font-['DM_Sans']">
                  Gold accent (#C9A84C) reserved for positive metrics and primary CTAs. Red/amber
                  only for gaps, warnings, and low scores—never decoratively.
                </p>
              </div>
              <div>
                <h4 className="font-['DM_Sans'] font-semibold mb-2">Micro-interactions</h4>
                <p className="text-sm text-muted-foreground font-['DM_Sans']">
                  Score rings animate on load, skill pills fade in staggered, match bars fill on
                  hover. Subtle animations enhance the experience without distraction.
                </p>
              </div>
              <div>
                <h4 className="font-['DM_Sans'] font-semibold mb-2">Accessibility First</h4>
                <p className="text-sm text-muted-foreground font-['DM_Sans']">
                  All components meet WCAG guidelines with proper contrast ratios, keyboard
                  navigation, and screen reader support.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
