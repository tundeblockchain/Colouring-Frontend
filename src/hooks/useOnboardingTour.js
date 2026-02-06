import { useEffect, useRef } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import '../styles/driver-tour.css'

const ONBOARDING_STORAGE_KEY = 'colorbliss_onboarding_complete'
const CREATE_TOUR_STORAGE_KEY = 'colorbliss_create_tour_complete'

const getCreateScreenTourSteps = () => [
  {
    element: '[data-tour="tour-text-prompts"]',
    popover: {
      title: 'Text prompts',
      description: 'Describe your coloring page in your own words.<br /><br />Type what you want to see—a dragon, a castle, a flower—and our AI will bring it to life.<br /><br />Don\'t worry about being perfect; you can improve it with one click.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="tour-improve-button"]',
    popover: {
      title: 'Improve button',
      description: 'Not sure how to describe your idea?<br /><br />Click Improve to have AI enhance your prompt with better details and styling suggestions.<br /><br />Great for getting more polished results.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="tour-create-settings"]',
    popover: {
      title: 'Settings',
      description: 'Customize your output: choose quality (fast vs standard), dimensions (square, portrait, or landscape), and how many images to generate.<br /><br />Subscribers can create multiple variations at once.',
      side: 'top',
      align: 'start',
    },
  },
]

const getTourSteps = () => [
  {
    popover: {
      title: 'Welcome to ColorBliss!',
      description: "Let's take a quick tour to get you started.<br /><br />We'll show you the key features so you can start creating beautiful coloring pages in no time.",
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="tour-create"]',
    popover: {
      title: 'Create',
      description: 'Start here to create new coloring pages.<br /><br />Click "Try it now" on any card to open the Create screen—we\'ll show you the text prompts, Improve button, and settings there.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="tour-feature-cards"]',
    popover: {
      title: 'How to create',
      description: 'Pick your creation method: describe with text, design with words & names, or turn your photos into coloring pages.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="tour-credits"]',
    popover: {
      title: 'Credits',
      description: 'Each coloring page you create uses credits from your balance.<br /><br />Click here anytime to see your remaining credits, plan details, and how to get more.<br /><br />You can upgrade your plan or buy one-time credit packs when you need them.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="tour-gallery"]',
    popover: {
      title: 'Gallery',
      description: 'All your saved coloring pages live here.<br /><br />Download, share, or organize them into folders.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="tour-favorites"]',
    popover: {
      title: 'Favorites',
      description: 'Quick access to the coloring pages you\'ve marked as favorites.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="tour-profile"]',
    popover: {
      title: 'Your profile',
      description: 'Manage your account, view credits, upgrade your plan, or sign out.',
      side: 'right',
      align: 'end',
    },
  },
]

export const isOnboardingComplete = () => {
  try {
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export const markOnboardingComplete = () => {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
  } catch {
    // ignore
  }
}

export const isCreateTourComplete = () => {
  try {
    return localStorage.getItem(CREATE_TOUR_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export const markCreateTourComplete = () => {
  try {
    localStorage.setItem(CREATE_TOUR_STORAGE_KEY, 'true')
  } catch {
    // ignore
  }
}

export const useOnboardingTour = (options = {}) => {
  const { runOnMount = false, delay = 500, forceRun = false, onStart } = options
  const driverRef = useRef(null)
  const hasRunRef = useRef(false)

  const startTour = () => {
    if (hasRunRef.current) return
    hasRunRef.current = true

    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      overlayColor: 'rgba(0, 0, 0, 0.6)',
      popoverClass: 'driver-popover-colorbliss',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Got it!',
      steps: getTourSteps(),
      onDestroyed: () => {
        markOnboardingComplete()
        hasRunRef.current = false
      },
      onCloseClick: () => {
        markOnboardingComplete()
        hasRunRef.current = false
      },
    })

    driverRef.current = driverObj
    onStart?.()
    driverObj.drive()
  }

  useEffect(() => {
    if (!runOnMount) return
    if (!forceRun && isOnboardingComplete()) return

    const timer = setTimeout(() => {
      startTour()
    }, delay)

    return () => clearTimeout(timer)
  }, [runOnMount, delay, forceRun])

  return { startTour }
}

export const useCreateScreenTour = (options = {}) => {
  const { runOnMount = false, delay = 600, forceRun = false } = options
  const hasRunRef = useRef(false)

  const startTour = () => {
    if (hasRunRef.current) return
    hasRunRef.current = true

    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      overlayColor: 'rgba(0, 0, 0, 0.6)',
      popoverClass: 'driver-popover-colorbliss',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Got it!',
      steps: getCreateScreenTourSteps(),
      onDestroyed: () => {
        markCreateTourComplete()
        hasRunRef.current = false
      },
      onCloseClick: () => {
        markCreateTourComplete()
        hasRunRef.current = false
      },
    })

    driverObj.drive()
  }

  useEffect(() => {
    if (!runOnMount) return
    if (!forceRun && isCreateTourComplete()) return

    const timer = setTimeout(() => {
      startTour()
    }, delay)

    return () => clearTimeout(timer)
  }, [runOnMount, delay, forceRun])

  return { startTour }
}
