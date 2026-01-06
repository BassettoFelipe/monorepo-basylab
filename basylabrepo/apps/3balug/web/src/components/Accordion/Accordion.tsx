import { classNames } from '@utils/classNames'
import { ChevronDown } from 'lucide-react'
import {
	type ButtonHTMLAttributes,
	createContext,
	type HTMLAttributes,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useState,
} from 'react'
import * as styles from './Accordion.css'

type AccordionVariant = 'default' | 'card' | 'bordered' | 'ghost'
type AccordionSpacing = 'default' | 'compact' | 'separated' | 'flush'

interface AccordionContextValue {
	openItems: string[]
	toggle: (value: string) => void
	variant: AccordionVariant
}

interface AccordionItemContextValue {
	value: string
	isOpen: boolean
	toggle: () => void
	disabled: boolean
}

const AccordionContext = createContext<AccordionContextValue | null>(null)
const AccordionItemContext = createContext<AccordionItemContextValue | null>(null)

function useAccordionContext() {
	const context = useContext(AccordionContext)
	if (!context) {
		throw new Error('Accordion components must be used within Accordion.Root')
	}
	return context
}

function useAccordionItemContext() {
	const context = useContext(AccordionItemContext)
	if (!context) {
		throw new Error('Accordion.Trigger and Accordion.Content must be used within Accordion.Item')
	}
	return context
}

interface RootProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode
	type?: 'single' | 'multiple'
	defaultValue?: string | string[]
	value?: string | string[]
	onValueChange?: (value: string | string[]) => void
	variant?: AccordionVariant
	spacing?: AccordionSpacing
	collapsible?: boolean
}

function Root({
	children,
	type = 'single',
	defaultValue,
	value: controlledValue,
	onValueChange,
	variant = 'default',
	spacing = 'default',
	collapsible = true,
	className,
	...props
}: RootProps) {
	const [internalValue, setInternalValue] = useState<string[]>(() => {
		if (defaultValue) {
			return Array.isArray(defaultValue) ? defaultValue : [defaultValue]
		}
		return []
	})

	const isControlled = controlledValue !== undefined
	const openItems = isControlled
		? Array.isArray(controlledValue)
			? controlledValue
			: [controlledValue]
		: internalValue

	const toggle = useCallback(
		(itemValue: string) => {
			let newValue: string[]

			if (type === 'single') {
				if (openItems.includes(itemValue)) {
					newValue = collapsible ? [] : openItems
				} else {
					newValue = [itemValue]
				}
			} else {
				if (openItems.includes(itemValue)) {
					newValue = openItems.filter((v) => v !== itemValue)
				} else {
					newValue = [...openItems, itemValue]
				}
			}

			if (!isControlled) {
				setInternalValue(newValue)
			}

			if (onValueChange) {
				onValueChange(type === 'single' ? (newValue[0] ?? '') : newValue)
			}
		},
		[type, openItems, collapsible, isControlled, onValueChange],
	)

	const contextValue = useMemo(() => ({ openItems, toggle, variant }), [openItems, toggle, variant])

	return (
		<AccordionContext.Provider value={contextValue}>
			<div className={classNames(styles.root, styles.rootVariant[spacing], className)} {...props}>
				{children}
			</div>
		</AccordionContext.Provider>
	)
}

interface ItemProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode
	value: string
	disabled?: boolean
}

function Item({ children, value, disabled = false, className, ...props }: ItemProps) {
	const { openItems, toggle, variant } = useAccordionContext()
	const isOpen = openItems.includes(value)

	const handleToggle = useCallback(() => {
		if (!disabled) {
			toggle(value)
		}
	}, [disabled, toggle, value])

	const contextValue = useMemo(
		() => ({ value, isOpen, toggle: handleToggle, disabled }),
		[value, isOpen, handleToggle, disabled],
	)

	return (
		<AccordionItemContext.Provider value={contextValue}>
			<div
				className={classNames(styles.item, styles.itemVariant[variant], className)}
				data-state={isOpen ? 'open' : 'closed'}
				data-disabled={disabled ? '' : undefined}
				{...props}
			>
				{children}
			</div>
		</AccordionItemContext.Provider>
	)
}

interface TriggerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
	children?: ReactNode
	title?: string
	subtitle?: string
	icon?: ReactNode
	hideIcon?: boolean
}

function Trigger({
	children,
	title,
	subtitle,
	icon,
	hideIcon = false,
	className,
	...props
}: TriggerProps) {
	const { isOpen, toggle, disabled, value } = useAccordionItemContext()

	return (
		<button
			type="button"
			className={classNames(styles.trigger, className)}
			onClick={toggle}
			disabled={disabled}
			aria-expanded={isOpen}
			aria-controls={`accordion-content-${value}`}
			data-state={isOpen ? 'open' : 'closed'}
			{...props}
		>
			{children ?? (
				<div className={styles.triggerContent}>
					{title && <span className={styles.triggerTitle}>{title}</span>}
					{subtitle && <span className={styles.triggerSubtitle}>{subtitle}</span>}
				</div>
			)}
			{!hideIcon && (
				<span className={styles.triggerIcon} data-state={isOpen ? 'open' : 'closed'}>
					{icon ?? <ChevronDown size={20} />}
				</span>
			)}
		</button>
	)
}

interface ContentProps extends HTMLAttributes<HTMLDivElement> {
	children: ReactNode
}

function Content({ children, className, ...props }: ContentProps) {
	const { isOpen, value } = useAccordionItemContext()

	if (!isOpen) {
		return null
	}

	return (
		<section
			id={`accordion-content-${value}`}
			className={classNames(styles.content, className)}
			data-state={isOpen ? 'open' : 'closed'}
			{...props}
		>
			<div className={styles.contentInner}>{children}</div>
		</section>
	)
}

Root.displayName = 'Accordion.Root'
Item.displayName = 'Accordion.Item'
Trigger.displayName = 'Accordion.Trigger'
Content.displayName = 'Accordion.Content'

export const Accordion = {
	Root,
	Item,
	Trigger,
	Content,
}
