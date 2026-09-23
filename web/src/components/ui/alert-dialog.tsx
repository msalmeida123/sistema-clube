'use client'
import * as React from 'react'
import * as Primitive from '@radix-ui/react-alert-dialog'
import {cn} from '@/lib/utils'
import {buttonVariants} from './button'
export const AlertDialog=Primitive.Root
export const AlertDialogTrigger=Primitive.Trigger
export const AlertDialogContent=React.forwardRef<React.ElementRef<typeof Primitive.Content>,React.ComponentPropsWithoutRef<typeof Primitive.Content>>(({className,...props},ref)=><Primitive.Portal><Primitive.Overlay className="fixed inset-0 z-50 bg-black/50"/><Primitive.Content ref={ref} className={cn('fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-lg space-y-4',className)} {...props}/></Primitive.Portal>)
AlertDialogContent.displayName='AlertDialogContent'
export function AlertDialogHeader(props:React.HTMLAttributes<HTMLDivElement>){return <div className="space-y-2" {...props}/>}
export function AlertDialogFooter(props:React.HTMLAttributes<HTMLDivElement>){return <div className="flex flex-wrap justify-end gap-3" {...props}/>}
export const AlertDialogTitle=React.forwardRef<React.ElementRef<typeof Primitive.Title>,React.ComponentPropsWithoutRef<typeof Primitive.Title>>((props,ref)=><Primitive.Title ref={ref} className="text-lg font-semibold" {...props}/>)
AlertDialogTitle.displayName='AlertDialogTitle'
export const AlertDialogDescription=React.forwardRef<React.ElementRef<typeof Primitive.Description>,React.ComponentPropsWithoutRef<typeof Primitive.Description>>((props,ref)=><Primitive.Description ref={ref} className="text-sm text-muted-foreground" {...props}/>)
AlertDialogDescription.displayName='AlertDialogDescription'
export const AlertDialogAction=React.forwardRef<React.ElementRef<typeof Primitive.Action>,React.ComponentPropsWithoutRef<typeof Primitive.Action>>((props,ref)=><Primitive.Action ref={ref} className={buttonVariants()} {...props}/>)
AlertDialogAction.displayName='AlertDialogAction'
export const AlertDialogCancel=React.forwardRef<React.ElementRef<typeof Primitive.Cancel>,React.ComponentPropsWithoutRef<typeof Primitive.Cancel>>((props,ref)=><Primitive.Cancel ref={ref} className={buttonVariants({variant:'outline'})} {...props}/>)
AlertDialogCancel.displayName='AlertDialogCancel'
