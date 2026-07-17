import { Link, useNavigate } from "react-router-dom"

import { useAuth } from "@/contexts/AuthContext"

import type { BillingInterval } from "@/api/billing"

import type { PlanId } from "@/data/pricingData"

import { ENTERPRISE_EMAIL } from "@/data/pricingData"

import { signupUrlForPlan, planCheckoutUrl } from "@/lib/startCheckout"

import { saveSelectedPlan, saveSelectedBillingInterval } from "@/lib/planStorage"

import { cn } from "@/lib/utils"



type CheckoutButtonProps = {

  planId: PlanId

  interval: BillingInterval

  label: string

  className?: string

  onClick?: (event: React.MouseEvent) => void

}



export function CheckoutButton({

  planId,

  interval,

  label,

  className,

  onClick,

}: CheckoutButtonProps) {

  const navigate = useNavigate()

  const { isAuthenticated } = useAuth()



  if (planId === "enterprise") {

    return (

      <a href={ENTERPRISE_EMAIL} className={cn("le-pricing-cta", className)}>

        {label}

      </a>

    )

  }



  function handleClick(event: React.MouseEvent) {

    event.stopPropagation()

    onClick?.(event)

    saveSelectedPlan(planId)

    saveSelectedBillingInterval(interval)



    if (!isAuthenticated) {

      navigate(signupUrlForPlan(planId, interval))

      return

    }



    navigate(planCheckoutUrl(planId, interval))

  }



  return (

    <div className="w-full">

      <button

        type="button"

        onClick={handleClick}

        className={cn("le-pricing-cta w-full", className)}

      >

        {label}

      </button>

      {!isAuthenticated && (

        <p className="mt-2 text-center text-[11px] opacity-75">

          Already have an account?{" "}

          <Link to="/auth/signin" className="underline">

            Sign in

          </Link>

        </p>

      )}

    </div>

  )

}


