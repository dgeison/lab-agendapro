import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { appointmentsService } from '../services/appointmentsService';
import { PublicProfile, TimeSlot, AppointmentCreate } from '../types/appointments';
import { Service } from '../types/services';

const PublicBookingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [clientData, setClientData] = useState({
    name: '',
    email: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'service' | 'datetime' | 'details' | 'confirmation'>('service');

  useEffect(() => {
    if (slug) {
      loadPublicData();
    }
  }, [slug]);

  useEffect(() => {
    if (selectedService && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedService, selectedDate]);

  const loadPublicData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Buscar perfil e serviços em paralelo
      const [profileData, servicesData] = await Promise.all([
        appointmentsService.getPublicProfile(slug!),
        appointmentsService.getPublicServices(slug!)
      ]);
      
      setProfile(profileData);
      setServices(servicesData);
    } catch (err: any) {
      setError('Profissional não encontrado ou indisponível');
      console.error('Erro ao carregar dados públicos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedService || !selectedDate) return;
    
    try {
      setSlotsLoading(true);
      const slots = await appointmentsService.getAvailableSlots(selectedService.id, selectedDate);
      setAvailableSlots(slots);
    } catch (err) {
      console.error('Erro ao carregar horários:', err);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedSlot(null);
    setStep('datetime');
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep('details');
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService || !selectedSlot || !clientData.name || !clientData.email) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setBooking(true);
      setError('');

      const appointmentData: AppointmentCreate = {
        service_id: selectedService.id,
        client_name: clientData.name,
        client_email: clientData.email,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end
      };

      const appointment = await appointmentsService.createAppointment(appointmentData);
      
      setStep('confirmation');
      
      // Aqui integraria com Stripe para pagamento
      // Por enquanto, simula confirmação
      console.log('Agendamento criado:', appointment);
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao criar agendamento');
    } finally {
      setBooking(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  };

  // Gerar próximos 30 dias úteis
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Pular fins de semana (opcional)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    
    return dates;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-primary-600">
                  {profile?.full_name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{profile?.full_name}</h1>
            <p className="text-gray-600 mt-2">Agende seu horário de forma rápida e segura</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex space-x-4">
            <div className={`flex items-center ${step === 'service' ? 'text-primary-600' : step === 'datetime' || step === 'details' || step === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'service' ? 'bg-primary-600 text-white' : step === 'datetime' || step === 'details' || step === 'confirmation' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">Serviço</span>
            </div>
            
            <div className={`w-8 h-px bg-gray-300 mt-4 ${step === 'datetime' || step === 'details' || step === 'confirmation' ? 'bg-green-600' : ''}`}></div>
            
            <div className={`flex items-center ${step === 'datetime' ? 'text-primary-600' : step === 'details' || step === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'datetime' ? 'bg-primary-600 text-white' : step === 'details' || step === 'confirmation' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Data/Hora</span>
            </div>
            
            <div className={`w-8 h-px bg-gray-300 mt-4 ${step === 'details' || step === 'confirmation' ? 'bg-green-600' : ''}`}></div>
            
            <div className={`flex items-center ${step === 'details' ? 'text-primary-600' : step === 'confirmation' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'details' ? 'bg-primary-600 text-white' : step === 'confirmation' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">Dados</span>
            </div>
          </div>
        </div>

        {/* Step 1: Select Service */}
        {step === 'service' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Escolha o serviço</h2>
            
            {services.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                Nenhum serviço disponível no momento.
              </p>
            ) : (
              <div className="grid gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{service.name}</h3>
                        {service.description && (
                          <p className="text-gray-600 text-sm mt-1">{service.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm text-gray-500">
                            ⏱️ {formatDuration(service.duration_minutes)}
                          </span>
                          <span className="text-lg font-semibold text-primary-600">
                            {formatPrice(service.price)}
                          </span>
                        </div>
                      </div>
                      <div className="text-primary-600">
                        →
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Date and Time */}
        {step === 'datetime' && selectedService && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Escolha data e horário</h2>
              <button
                onClick={() => setStep('service')}
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                ← Voltar
              </button>
            </div>

            {/* Selected Service Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900">{selectedService.name}</h3>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-sm text-gray-600">
                  {formatDuration(selectedService.duration_minutes)}
                </span>
                <span className="text-sm font-medium text-primary-600">
                  {formatPrice(selectedService.price)}
                </span>
              </div>
            </div>

            {/* Date Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Selecione uma data:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {getAvailableDates().slice(0, 8).map((date) => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`p-3 text-sm rounded-lg border transition-colors ${
                      selectedDate === date
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {new Date(date).toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit'
                    })}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Horários disponíveis para {formatDate(selectedDate)}:
                </label>
                
                {slotsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Carregando horários...</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    Nenhum horário disponível para esta data.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {availableSlots.filter(slot => slot.available).map((slot) => (
                      <button
                        key={slot.start}
                        onClick={() => handleSlotSelect(slot)}
                        className="p-2 text-sm rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      >
                        {formatTime(slot.start)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Client Details */}
        {step === 'details' && selectedService && selectedSlot && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Seus dados</h2>
              <button
                onClick={() => setStep('datetime')}
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                ← Voltar
              </button>
            </div>

            {/* Booking Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Resumo do agendamento:</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-600">Serviço:</span> {selectedService.name}</p>
                <p><span className="text-gray-600">Data:</span> {formatDate(selectedSlot.start)}</p>
                <p><span className="text-gray-600">Horário:</span> {formatTime(selectedSlot.start)} - {formatTime(selectedSlot.end)}</p>
                <p><span className="text-gray-600">Valor:</span> <span className="font-medium text-primary-600">{formatPrice(selectedService.price)}</span></p>
              </div>
            </div>

            {/* Client Form */}
            <form onSubmit={handleBooking}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientData.name}
                    onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={clientData.email}
                    onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={booking}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-md font-medium disabled:opacity-50"
                >
                  {booking ? 'Processando...' : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 'confirmation' && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Agendamento realizado com sucesso!
            </h2>
            <p className="text-gray-600 mb-6">
              Você receberá uma confirmação por email em breve.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-medium text-gray-900 mb-2">Detalhes do agendamento:</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-600">Profissional:</span> {profile?.full_name}</p>
                <p><span className="text-gray-600">Serviço:</span> {selectedService?.name}</p>
                <p><span className="text-gray-600">Data:</span> {selectedSlot && formatDate(selectedSlot.start)}</p>
                <p><span className="text-gray-600">Horário:</span> {selectedSlot && formatTime(selectedSlot.start)} - {selectedSlot && formatTime(selectedSlot.end)}</p>
                <p><span className="text-gray-600">Cliente:</span> {clientData.name}</p>
                <p><span className="text-gray-600">Email:</span> {clientData.email}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setStep('service');
                setSelectedService(null);
                setSelectedSlot(null);
                setClientData({ name: '', email: '' });
                setSelectedDate('');
              }}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-md"
            >
              Fazer Novo Agendamento
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600 text-sm">
            <p>Powered by <span className="font-medium text-primary-600">AgendaPro</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicBookingPage;