"use client"

import { motion } from "framer-motion"
import {
  Video,
  Eye,
  ThumbsUp,
  TrendingUp,
  Play,
  Clock,
  MoreHorizontal,
  Plus,
  Sparkles,
  Upload,
  Scissors,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Target,
  Users,
  Share2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const stats = [
  {
    title: "Total Videos",
    value: "124",
    change: "+12",
    changeLabel: "vs last month",
    trend: "up",
    icon: Video,
  },
  {
    title: "Total Views",
    value: "1.2M",
    change: "+23%",
    changeLabel: "vs last month",
    trend: "up",
    icon: Eye,
  },
  {
    title: "Engagement Rate",
    value: "8.4%",
    change: "+2.1%",
    changeLabel: "vs last month",
    trend: "up",
    icon: ThumbsUp,
  },
  {
    title: "New Subscribers",
    value: "2,340",
    change: "-5%",
    changeLabel: "vs last month",
    trend: "down",
    icon: Users,
  },
]

const quickActions = [
  { icon: Plus, label: "New Video", color: "bg-primary text-primary-foreground" },
  { icon: Sparkles, label: "AI Generate", color: "bg-gradient-to-br from-violet-500 to-purple-600 text-white" },
  { icon: Upload, label: "Upload", color: "bg-blue-500 text-white" },
  { icon: Scissors, label: "Quick Edit", color: "bg-emerald-500 text-white" },
]

const recentVideos = [
  {
    title: "10 Tips for Better Content",
    views: "24.5K",
    duration: "12:34",
    status: "Published",
    engagement: 12.4,
    thumbnail: "bg-gradient-to-br from-primary/30 to-primary/10",
  },
  {
    title: "How I Grew to 100K",
    views: "18.2K",
    duration: "15:22",
    status: "Published",
    engagement: 9.8,
    thumbnail: "bg-gradient-to-br from-blue-500/30 to-blue-500/10",
  },
  {
    title: "Morning Routine 2024",
    views: "12.1K",
    duration: "8:45",
    status: "Processing",
    engagement: 0,
    thumbnail: "bg-gradient-to-br from-green-500/30 to-green-500/10",
  },
  {
    title: "Studio Tour Update",
    views: "-",
    duration: "20:15",
    status: "Draft",
    engagement: 0,
    thumbnail: "bg-gradient-to-br from-amber-500/30 to-amber-500/10",
  },
]

const scheduledContent = [
  { title: "Product Review: New Camera", date: "Tomorrow, 3:00 PM", platform: "YouTube" },
  { title: "Quick Tips #45", date: "Apr 26, 10:00 AM", platform: "TikTok" },
  { title: "Behind the Scenes", date: "Apr 27, 2:00 PM", platform: "Instagram" },
]

const topPerforming = [
  { title: "Viral Hook Tutorial", views: "156K", growth: "+340%" },
  { title: "Day in My Life", views: "98K", growth: "+180%" },
  { title: "Studio Setup Guide", views: "72K", growth: "+95%" },
]

const weeklyData = [
  { day: "Mon", value: 65 },
  { day: "Tue", value: 85 },
  { day: "Wed", value: 45 },
  { day: "Thu", value: 90 },
  { day: "Fri", value: 120 },
  { day: "Sat", value: 75 },
  { day: "Sun", value: 95 },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function DashboardContent() {
  const maxValue = Math.max(...weeklyData.map((d) => d.value))

  return (
    <div className="p-6 space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-foreground">Welcome back, John</h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your content today.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap gap-2"
        >
          {quickActions.map((action, index) => (
            <Button
              key={index}
              className={`${action.color} gap-2 shadow-sm hover:shadow-md transition-shadow`}
              size="sm"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Button>
          ))}
        </motion.div>
      </div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Card className="bg-card border-border hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {stat.trend === "up" ? (
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          stat.trend === "up" ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {stat.change}
                      </span>
                      <span className="text-xs text-muted-foreground">{stat.changeLabel}</span>
                    </div>
                  </div>
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Views Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold text-foreground">
                Weekly Views Overview
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
                View Report
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-40 mt-4">
                {weeklyData.map((item, index) => (
                  <div key={index} className="flex flex-col items-center gap-2 flex-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(item.value / maxValue) * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                      className="w-full max-w-[40px] bg-primary/20 rounded-t-md relative group cursor-pointer hover:bg-primary/30 transition-colors"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.value}K views
                      </div>
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-md transition-all"
                        style={{ height: "60%" }}
                      />
                    </motion.div>
                    <span className="text-xs text-muted-foreground">{item.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Scheduled Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-card border-border h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Scheduled
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-primary text-xs">
                View All
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {scheduledContent.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.date} • {item.platform}
                    </p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Videos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold text-foreground">
                Recent Videos
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-primary text-xs">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentVideos.map((video, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div
                      className={`w-20 h-12 rounded-lg ${video.thumbnail} flex items-center justify-center shrink-0`}
                    >
                      <Play className="h-5 w-5 text-foreground/50 group-hover:text-foreground group-hover:scale-110 transition-all" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground text-sm truncate">
                        {video.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {video.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {video.duration}
                        </span>
                        {video.engagement > 0 && (
                          <span className="flex items-center gap-1 text-emerald-500">
                            <TrendingUp className="h-3 w-3" />
                            {video.engagement}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          video.status === "Published"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : video.status === "Processing"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {video.status}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Performing & Goals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="space-y-6"
        >
          {/* Top Performing */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Top Performing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topPerforming.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-primary">#{index + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.views} views</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-emerald-500">{item.growth}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Monthly Goal */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Monthly Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Videos Created</span>
                    <span className="text-sm font-medium text-foreground">12/15</span>
                  </div>
                  <Progress value={80} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Views Target</span>
                    <span className="text-sm font-medium text-foreground">850K/1M</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">New Followers</span>
                    <span className="text-sm font-medium text-foreground">2.3K/5K</span>
                  </div>
                  <Progress value={46} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
