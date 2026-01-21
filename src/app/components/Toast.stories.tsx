import type { Meta, StoryObj } from '@storybook/react';
import Toast from './Toast';

const meta = {
    title: 'Components/Toast',
    component: Toast,
    tags: ['autodocs'],
    argTypes: {
        show: { control: 'boolean' },
        message: { control: 'text' },
    },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        show: true,
        message: 'This is a toast message',
        onClose: () => console.log('closed'),
    },
};
