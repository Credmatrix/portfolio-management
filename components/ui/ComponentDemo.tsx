'use client';

import React, { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Input,
  Select,
  Checkbox,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Toast,
  ToastContainer,
  useToast
} from './index';
import { Search, Download, Settings, Plus } from 'lucide-react';

export function ComponentDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const { toasts, success, error, warning, info } = useToast();

  return (
    <div className="p-8 space-y-8 bg-neutral-10 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-neutral-90 mb-8">
          Fluent Design UI Components
        </h1>

        {/* Buttons Section */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold text-neutral-90">Buttons</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-neutral-70">Primary</h3>
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-neutral-70">Secondary</h3>
                <Button variant="secondary" size="sm">Small</Button>
                <Button variant="secondary" size="md">Medium</Button>
                <Button variant="secondary" size="lg">Large</Button>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-neutral-70">Outline</h3>
                <Button variant="outline" size="sm">Small</Button>
                <Button variant="outline" size="md">Medium</Button>
                <Button variant="outline" size="lg">Large</Button>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-neutral-70">With Icons</h3>
                <Button variant="primary" leftIcon={<Plus />}>Add Item</Button>
                <Button variant="secondary" rightIcon={<Download />}>Download</Button>
                <Button variant="outline" leftIcon={<Search />}>Search</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards Section */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold text-neutral-90">Cards</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card variant="default">
                <CardContent>
                  <h3 className="font-medium">Default Card</h3>
                  <p className="text-neutral-60 text-sm mt-1">Standard card with default styling</p>
                </CardContent>
              </Card>
              <Card variant="elevated" hoverable>
                <CardContent>
                  <h3 className="font-medium">Elevated Card</h3>
                  <p className="text-neutral-60 text-sm mt-1">Card with elevated shadow (hover me)</p>
                </CardContent>
              </Card>
              <Card variant="outlined" clickable onClick={() => setIsModalOpen(true)}>
                <CardContent>
                  <h3 className="font-medium">Clickable Card</h3>
                  <p className="text-neutral-60 text-sm mt-1">Click to open modal</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Form Controls Section */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold text-neutral-90">Form Controls</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Input
                  label="Text Input"
                  placeholder="Enter some text..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  helperText="This is a helper text"
                />
                <Input
                  label="Input with Icon"
                  placeholder="Search..."
                  leftIcon={<Search />}
                  variant="filled"
                />
                <Input
                  label="Error State"
                  placeholder="Invalid input"
                  error="This field is required"
                  variant="default"
                />
              </div>
              <div className="space-y-4">
                <Select
                  label="Select Dropdown"
                  placeholder="Choose an option"
                  value={selectValue}
                  onChange={(e) => setSelectValue(e.target.value)}
                >
                  <option value="option1">Option 1</option>
                  <option value="option2">Option 2</option>
                  <option value="option3">Option 3</option>
                </Select>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-neutral-90">Checkboxes</label>
                  <Checkbox
                    label="Default Checkbox"
                    checked={checkboxValue}
                    onChange={setCheckboxValue}
                  />
                  <Checkbox
                    label="Checkbox with Description"
                    description="This checkbox has additional description text"
                    size="md"
                  />
                  <Checkbox
                    label="Disabled Checkbox"
                    disabled
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Toast Section */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold text-neutral-90">Toast Notifications</h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="success"
                onClick={() => success({ title: 'Success!', description: 'Operation completed successfully' })}
              >
                Show Success
              </Button>
              <Button
                variant="error"
                onClick={() => error({ title: 'Error!', description: 'Something went wrong' })}
              >
                Show Error
              </Button>
              <Button
                variant="warning"
                onClick={() => warning({ title: 'Warning!', description: 'Please check your input' })}
              >
                Show Warning
              </Button>
              <Button
                variant="info"
                onClick={() => info({ title: 'Info', description: 'Here is some information' })}
              >
                Show Info
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card variant="default" className="border-l-4 border-l-success">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-60">Success Rate</p>
                  <p className="text-2xl font-bold text-success">98.5%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="default" className="border-l-4 border-l-primary-500">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-60">Total Users</p>
                  <p className="text-2xl font-bold text-primary-500">1,234</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="default" className="border-l-4 border-l-warning">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-60">Pending</p>
                  <p className="text-2xl font-bold text-warning">23</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="default" className="border-l-4 border-l-error">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-60">Failed</p>
                  <p className="text-2xl font-bold text-error">5</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Example Modal"
        size="md"
      >
        <ModalBody>
          <p className="text-neutral-70">
            This is an example modal with Fluent Design styling. It includes proper backdrop,
            animations, and keyboard navigation support.
          </p>
          <div className="mt-4">
            <Input
              label="Modal Input"
              placeholder="Type something..."
              fullWidth
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setIsModalOpen(false)}>
            Save Changes
          </Button>
        </ModalFooter>
      </Modal>

      {/* Toast Container */}
      <ToastContainer position="top-right">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </ToastContainer>
    </div>
  );
}