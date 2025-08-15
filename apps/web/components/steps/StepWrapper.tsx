interface StepProps {
    title: string;
    children: React.ReactNode;
}

export default function Step({ title, children }: StepProps) {
    return (
        <li style={{ marginBottom: '1em' }}>
            <h4>{title}</h4>
            {children}
        </li>
    );
}