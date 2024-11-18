"use client"

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Puzzle, Star, X, ChevronLeft, Volume2, Mic } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import localImage from '../public/doordash-homepage.png'

export default function AccessibilityReviewOverlay() {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const [reviewMode, setReviewMode] = useState(null) // 'general', 'annotate', or null
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectedArea, setSelectedArea] = useState(null)
  const [disability, setDisability] = useState("")
  const [review, setReview] = useState("")
  const [rating, setRating] = useState(0)
  const [reviews, setReviews] = useState([])
  const [showReviews, setShowReviews] = useState(false)
  const [isHighContrast, setIsHighContrast] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const selectionRef = useRef(null)
  const backgroundRef = useRef(null)
  const speechSynthesis = typeof(window) !== 'undefined' ? window.speechSynthesis : null
  const speechRecognition = typeof(window) !== 'undefined' ? window.SpeechRecognition ||window.webkitSpeechRecognition : null

  const overlayStyles = {
    fontFamily: 'OpenDyslexic, sans-serif',
    fontSize: '18px',
    lineHeight: '1.5',
    letterSpacing: '0.05em',
  }

  useEffect(() => {
    if (isSelecting) {
      document.addEventListener('mousedown', startSelection)
      document.addEventListener('mousemove', updateSelection)
      document.addEventListener('mouseup', endSelection)

      return () => {
        document.removeEventListener('mousedown', startSelection)
        document.removeEventListener('mousemove', updateSelection)
        document.removeEventListener('mouseup', endSelection)
      }
    }
  }, [isSelecting])

  const startSelection = (e) => {
    if (!backgroundRef.current.contains(e.target)) return
    const rect = backgroundRef.current.getBoundingClientRect()
    selectionRef.current = {
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
    }
  }

  const updateSelection = (e) => {
    if (!selectionRef.current) return
    const rect = backgroundRef.current.getBoundingClientRect()
    const endX = e.clientX - rect.left
    const endY = e.clientY - rect.top
    setSelectedArea({
      left: Math.min(selectionRef.current.startX, endX),
      top: Math.min(selectionRef.current.startY, endY),
      width: Math.abs(endX - selectionRef.current.startX),
      height: Math.abs(endY - selectionRef.current.startY),
    })
  }

  const endSelection = () => {
    setIsSelecting(false)
    selectionRef.current = null
  }

  const handleSubmitReview = () => {
    const newReview = {
      id: Date.now(),
      type: reviewMode,
      disability,
      review,
      rating: reviewMode === 'general' ? rating : null,
      selectedArea: reviewMode === 'annotate' ? selectedArea : null,
      timestamp: new Date().toISOString()
    }
    setReviews([...reviews, newReview])
    resetReviewState()
    setShowReviews(true)
    setIsOverlayOpen(true)
  }

  const resetReviewState = () => {
    setReviewMode(null)
    setSelectedArea(null)
    setDisability("")
    setReview("")
    setRating(0)
  }

  const speak = (text) => {
    if (speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text)
      speechSynthesis.speak(utterance)
    }
  }

  const startListening = () => {
    if (speechRecognition) {
      const recognition = new speechRecognition()
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setReview(transcript)
      }
      recognition.start()
      setIsListening(true)
    }
  }

  const stopListening = () => {
    if (speechRecognition && isListening) {
      speechRecognition.stop()
      setIsListening(false)
    }
  }

  const ReviewList = () => (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{review.type === 'general' ? 'General Review' : 'Annotated Review'}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(review.timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="px-2 py-1 text-sm bg-primary/10 rounded-md">
                  {review.disability}
                </div>
              </div>
              {review.type === 'general' && (
                <div className="mt-2 flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${review.rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
              )}
              <p className="mt-2">{review.review}</p>
              {review.type === 'annotate' && (
                <div className="mt-2 p-2 border rounded">
                  <p className="text-sm text-muted-foreground">Annotated Area:</p>
                  <p className="text-sm">
                    Left: {review.selectedArea.left.toFixed(0)}px, 
                    Top: {review.selectedArea.top.toFixed(0)}px, 
                    Width: {review.selectedArea.width.toFixed(0)}px, 
                    Height: {review.selectedArea.height.toFixed(0)}px
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )

  return (
    <div className="font-opendyslexic relative w-full h-screen overflow-hidden" ref={backgroundRef}>
      <Image
        src={localImage}
        alt="DoorDash homepage"
        objectFit="cover"
        priority
      />

      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 right-4 bg-white"
        onClick={() => setIsOverlayOpen(true)}
      >
        <Puzzle className="h-4 w-4" />
        <span className="sr-only">Open accessibility review</span>
      </Button>

      {reviews.filter(r => r.type === 'annotate').map((review) => (
        <TooltipProvider key={review.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-40 cursor-pointer"
                style={{
                  left: `${review.selectedArea.left}px`,
                  top: `${review.selectedArea.top}px`,
                  width: `${review.selectedArea.width}px`,
                  height: `${review.selectedArea.height}px`,
                }}
                onClick={() => speak(review.review)}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>{review.review}</p>
              <p className="text-sm text-muted-foreground mt-1">{review.disability}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}

      {isOverlayOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md font-opendyslexic">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Accessibility Review</h2>
                  <Button variant="ghost" size="icon" onClick={() => { setIsOverlayOpen(false); setShowReviews(false); }}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
                {showReviews ? (
                  <>
                    <Button
                      variant="ghost"
                      className="mb-2"
                      onClick={() => setShowReviews(false)}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <ReviewList />
                  </>
                ) : !reviewMode ? (
                  <div className="space-y-2">
                    <Button className="w-full" onClick={() => setReviewMode('general')}>
                      Give General Review
                    </Button>
                    <Button className="w-full" onClick={() => { setReviewMode('annotate'); setIsSelecting(true); setIsOverlayOpen(false); }}>
                      Annotate and Review
                    </Button>
                    <Button className="w-full" onClick={() => setShowReviews(true)}>
                      View Existing Reviews
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="disability">Disability Category</Label>
                      <Select value={disability} onValueChange={setDisability}>
                        <SelectTrigger id="disability">
                          <SelectValue placeholder="Select disability category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="phono">Phonological Dyslexia</SelectItem>
                          <SelectItem value="surface">Surface Dyslexia</SelectItem>
                          <SelectItem value="rapid">Rapid Naming Deficit</SelectItem>
                          <SelectItem value="double">Double Deficit Dyslexia </SelectItem>
                          <SelectItem value="attentional">Attentional Dyslexia</SelectItem>
                          <SelectItem value="visual">Visual Dyslexia</SelectItem>
                          <SelectItem value="don't know">Don't Know</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {reviewMode === 'general' && (
                      <div className="space-y-2">
                        <Label>Rating</Label>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Button
                              key={star}
                              variant="ghost"
                              size="icon"
                              onClick={() => setRating(star)}
                            >
                              <Star className={`h-4 w-4 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                              <span className="sr-only">{star} stars</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="review">Accessibility Review</Label>
                      <Textarea
                        id="review"
                        placeholder="Describe the accessibility issues or improvements needed..."
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                      />
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => speak(review)}
                        >
                          <Volume2 className="h-4 w-4" />
                          <span className="sr-only">Read aloud</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={isListening ? stopListening : startListening}
                        >
                          <Mic className={`h-4 w-4 ${isListening ? 'text-red-500' : ''}`} />
                          <span className="sr-only">{isListening ? 'Stop listening' : 'Start speech-to-text'}</span>
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => { resetReviewState(); setShowReviews(false); }}>
                        Cancel
                      </Button>
                      <Button onClick={handleSubmitReview}>
                        Submit Review
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isSelecting && (
        <div className="fixed inset-0 bg-black/30 cursor-crosshair z-40">
          {selectedArea && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-40"
              style={{
                left: `${selectedArea.left}px`,
                top: `${selectedArea.top}px`,
                width: `${selectedArea.width}px`,
                height: `${selectedArea.height}px`,
              }}
            />
          )}
        </div>
      )}

      {selectedArea && !isSelecting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md font-opendyslexic">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Annotated Review</h2>
                <div className="space-y-2">
                  <Label htmlFor="disability">Disability Category</Label>
                  <Select value={disability} onValueChange={setDisability}>
                    <SelectTrigger id="disability">
                      <SelectValue placeholder="Select disability category" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="phono">Phonological Dyslexia</SelectItem>
                          <SelectItem value="surface">Surface Dyslexia</SelectItem>
                          <SelectItem value="rapid">Rapid Naming Deficit</SelectItem>
                          <SelectItem value="double">Double Deficit Dyslexia </SelectItem>
                          <SelectItem value="attentional">Attentional Dyslexia</SelectItem>
                          <SelectItem value="visual">Visual Dyslexia</SelectItem>
                          <SelectItem value="don't know">Don't Know</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review">Accessibility Review</Label>
                  <Textarea
                    id="review"
                    placeholder="Describe the accessibility issues or improvements needed for the selected area..."
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                  />
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => speak(review)}
                    >
                      <Volume2 className="h-4 w-4" />
                      <span className="sr-only">Read aloud</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={isListening ? stopListening : startListening}
                    >
                      <Mic className={`h-4 w-4 ${isListening ? 'text-red-500' : ''}`} />
                      <span className="sr-only">{isListening ? 'Stop listening' : 'Start speech-to-text'}</span>
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => { resetReviewState(); setIsOverlayOpen(true); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitReview}>
                    Submit Review
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}